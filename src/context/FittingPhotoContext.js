import React, { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FittingPhotoContext = createContext();

export const useFittingPhoto = () => useContext(FittingPhotoContext);

/**
 * "Upload once, try anything." — one reusable fitting-room photograph, held
 * for the life of this browser tab.
 *
 * WHY IN MEMORY, NOTHING MORE: the Try-On backend never persists the source
 * photograph — it lands in a temp file for one generation and is deleted the
 * moment that job ends (metashop-backend/controllers/tryonController.js).
 * There is no upload ID, no server-side reference to reuse. Keeping this
 * photo anywhere more durable than the tab itself — localStorage, a new
 * database row, a Cloudinary copy of the source image — would make this
 * app hold a stranger's photograph for *longer* than it does today, which is
 * the opposite of the point. A React Context above the router is the
 * smallest thing that survives what actually needs surviving: navigating
 * from one product to the next. A hard refresh clears it, same as today.
 *
 * TryOnExperience still owns every part of the actual Try-On flow — upload
 * validation, the POST to /api/vton/generate, polling, the result, the
 * compare slider. This context only remembers the File so that flow can be
 * triggered without asking the visitor to pick it again.
 */
export function FittingPhotoProvider({ children }) {
  const { user } = useAuth() || {};
  const [photo, setPhoto] = useState(null); // { file, previewUrl } | null
  const previewUrlRef = useRef(null);
  const lastUserKeyRef = useRef(undefined);

  const revokeCurrent = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const setFittingPhoto = useCallback((file) => {
    if (!file) return;
    revokeCurrent();
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setPhoto({ file, previewUrl });
  }, [revokeCurrent]);

  const clearFittingPhoto = useCallback(() => {
    revokeCurrent();
    setPhoto(null);
  }, [revokeCurrent]);

  // A shared browser tab must never hand one account's photograph to the
  // next. Clear the saved photo whenever the signed-in identity changes —
  // logging out, logging in as someone else, or a guest becoming a user.
  useEffect(() => {
    const userKey = user ? (user.id || user._id || true) : null;
    if (lastUserKeyRef.current !== undefined && lastUserKeyRef.current !== userKey) {
      revokeCurrent();
      setPhoto(null);
    }
    lastUserKeyRef.current = userKey;
  }, [user, revokeCurrent]);

  useEffect(() => () => revokeCurrent(), [revokeCurrent]);

  return (
    <FittingPhotoContext.Provider
      value={{
        photoFile: photo?.file || null,
        photoPreviewUrl: photo?.previewUrl || null,
        hasFittingPhoto: !!photo,
        setFittingPhoto,
        clearFittingPhoto
      }}
    >
      {children}
    </FittingPhotoContext.Provider>
  );
}
