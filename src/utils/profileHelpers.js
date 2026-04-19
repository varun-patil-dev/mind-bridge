import {
  collection,
  documentId,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseClient';
import { generateUsername } from './usernameGenerator';

export const ensureUserProfile = async (user) => {
  if (!user?.uid) return null;

  const profileRef = doc(db, 'profiles', user.uid);
  const profileSnapshot = await getDoc(profileRef);
  if (profileSnapshot.exists()) {
    return {
      user_id: user.uid,
      ...profileSnapshot.data(),
    };
  }

  const username = generateUsername();
  const profile = {
    user_id: user.uid,
    username,
    created_at: serverTimestamp(),
  };

  await setDoc(profileRef, profile);
  return profile;
};

export const fetchProfilesByUserId = async (userIds) => {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];
  if (uniqueUserIds.length === 0) return {};

  const chunks = [];
  for (let index = 0; index < uniqueUserIds.length; index += 30) {
    chunks.push(uniqueUserIds.slice(index, index + 30));
  }

  const profilesByUserId = {};
  await Promise.all(chunks.map(async (chunk) => {
    const snapshot = await getDocs(query(
      collection(db, 'profiles'),
      where(documentId(), 'in', chunk)
    ));

    snapshot.forEach((profileDoc) => {
      profilesByUserId[profileDoc.id] = {
        user_id: profileDoc.id,
        ...profileDoc.data(),
      };
    });
  }));

  return profilesByUserId;
};

export const attachProfiles = async (rows) => {
  const safeRows = rows || [];
  const profilesByUserId = await fetchProfilesByUserId(safeRows.map((row) => row.user_id));

  return safeRows.map((row) => ({
    ...row,
    profiles: profilesByUserId[row.user_id] || null,
  }));
};
