import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
export async function uploadHostelPhotos(hostelId, files){
  const urls=[];
  for(const file of files){
    const r=ref(storage,`hostels/${hostelId}/${Date.now()}_${file.name}`);
    await uploadBytes(r,file);
    urls.push(await getDownloadURL(r));
  }
  return urls;
}