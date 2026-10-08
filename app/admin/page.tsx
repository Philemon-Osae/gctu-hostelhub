"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc, where } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

export default function AdminPage() {
  const [user] = useAuthState(auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_VERIFICATION"); // Default show pending

  // CHANGE THIS TO YOUR ADMIN EMAIL
  const ADMIN_EMAILS = ["philemonosae1@gmail.com", "philjazzy46@gmail.com"];

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      let q;
      if (filter === "ALL") {
        q = query(collection(db, "bookings"), orderBy("bookedAt", "desc"));
      } else {
        q = query(collection(db, "bookings"), where("status", "==", filter), orderBy("bookedAt", "desc"));
      }
      const snap = await getDocs(q);
      setBookings(snap.docs.map(d => ({ id: d.id,...d.data() })));
    } catch (e) {
      console.error(e);
      // Fallback without orderBy if index missing
      const snap = await getDocs(collection(db, "bookings"));
      let data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      if (filter!== "ALL") data = data.filter(b => b.status === filter);
      setBookings(data);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (booking) => {
    if (!confirm(`Verify you received 50 GHS from ${booking.userEmail} with ID ${booking.transId} on 0206834470?\n\nApprove?`)) return;
    await updateDoc(doc(db, "bookings", booking.id), {
      status: "BOOKED",
      verified: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: user.email,
    });
    alert(`✅ Approved ${booking.hostelName} for ${booking.userEmail}`);
    fetchBookings();
  };

  const handleCancel = async (booking) => {
    if (!confirm(`Cancel? This means NO payment found for ${booking.transId} from ${booking.userEmail}`)) return;
    await updateDoc(doc(db, "bookings", booking.id), {
      status: "CANCELLED",
      verified: false,
      cancelledAt: new Date().toISOString(),
      cancelReason: "No MoMo payment found on 0206834470",
    });
    alert(`❌ Cancelled fake booking`);
    fetchBookings();
  };

  const handleDelete = async (id) => {
    if (!confirm("Permanently delete this booking?")) return;
    await deleteDoc(doc(db, "bookings", id));
    fetchBookings();
  };

  if (loading) return <div className="p-6">Loading admin...</div>;
  if (!user) return <div className="p-6">Please login</div>;

  // Simple admin check
  if (!ADMIN_EMAILS.includes(user.email) && user.email!== "admin@gctu.edu.gh") {
    // Remove this check if you want all logged users to test
    // return <div className="p-6">Not admin: {user.email}</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Admin - Verify Payments to 0206834470</h1>
      <p className="text-sm text-gray-600">Logged as: {user.email}</p>

      <div className="flex gap-2 my-4">
        <button onClick={() => setFilter("PENDING_VERIFICATION")} className={`px-4 py-2 rounded ${filter==="PENDING_VERIFICATION"?"bg-yellow-600 text-white":"bg-gray-200"}`}>
          ⏳ Pending ({bookings.length} when filtered)
        </button>
        <button onClick={() => setFilter("BOOKED")} className={`px-4 py-2 rounded ${filter==="BOOKED"?"bg-green-600 text-white":"bg-gray-200"}`}>
          ✅ Booked
        </button>
        <button onClick={() => setFilter("CANCELLED")} className={`px-4 py-2 rounded ${filter==="CANCELLED"?"bg-red-600 text-white":"bg-gray-200"}`}>
          ❌ Cancelled
        </button>
        <button onClick={() => setFilter("ALL")} className={`px-4 py-2 rounded ${filter==="ALL"?"bg-black text-white":"bg-gray-200"}`}>
          All
        </button>
      </div>

      <div className="bg-yellow-50 border p-3 rounded text-sm mb-4">
        <b>How to verify:</b> Open your Vodafone Cash app on 0206834470 → Check transactions → Find 50 GHS from student → If found click ✅ Approve → If not found click ❌ Cancel
      </div>

      {bookings.map((b) => (
        <div key={b.id} className="border p-4 mb-3 rounded bg-white flex justify-between">
          <div className="text-sm">
            <p><b>{b.hostelName}</b> - {b.roomType}</p>
            <p>User: {b.userEmail} | {b.userId?.slice(0,6)}</p>
            <p>Trans ID: <b className="font-mono bg-gray-100 px-1">{b.transId}</b> - 50 GHS to 0206834470</p>
            <p>Date: {b.bookedAt? new Date(b.bookedAt).toLocaleString() : ""}</p>
            <p>Status: <span className={`px-2 py-1 rounded text-xs ${b.status==="PENDING_VERIFICATION"?"bg-yellow-200":b.status==="BOOKED"?"bg-green-200":"bg-red-200"}`}>{b.status}</span></p>
          </div>
          <div className="flex flex-col gap-2">
            {b.status === "PENDING_VERIFICATION" && (
              <>
                <button onClick={() => handleApprove(b)} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold">
                  ✅ Approve
                </button>
                <button onClick={() => handleCancel(b)} className="bg-red-600 text-white px-4 py-2 rounded text-sm">
                  ❌ Cancel (No Payment)
                </button>
              </>
            )}
            <button onClick={() => handleDelete(b.id)} className="text-xs text-gray-400 underline">Delete</button>
          </div>
        </div>
      ))}

      {bookings.length === 0 && <p className="text-center p-10 text-gray-500">No {filter} bookings</p>}
    </div>
  );
}