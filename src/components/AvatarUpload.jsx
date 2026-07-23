import { useRef } from "react";
import { Camera } from "lucide-react";
import { Label } from "@/components/ui/label";

// Circular avatar picker + live preview — shared by ProfileSetup.jsx and
// Account.jsx. Doesn't upload anything itself; just hands the raw File
// and a local preview URL back to the parent, which calls
// lib/firebase.js's uploadAvatar() on actual form submit. That keeps this
// component dumb and reusable instead of tied to one save flow.
export default function AvatarUpload({ preview, onSelect }) {
  const inputRef = useRef(null);

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // matches storage.rules 5MB cap
    onSelect(file, URL.createObjectURL(file));
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Label className="sr-only">Profile picture</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
      >
        {preview ? (
          <img src={preview} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-6 w-6 text-muted-foreground" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs font-medium underline underline-offset-2"
      >
        {preview ? "Change photo" : "Add a photo"}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );
}
