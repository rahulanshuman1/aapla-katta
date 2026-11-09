import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../store';
import { initNative, registerPush, isNative } from '../native';

/** Wires the website to the phone: status bar, back button, deep links and push notifications (renders nothing). */
export default function NativeBridge() {
  const nav = useNavigate();
  const { user, toast } = useApp();

  useEffect(() => { initNative(nav); }, []); // eslint-disable-line

  // register this phone for push notifications whenever someone is signed in
  useEffect(() => {
    if (isNative && user?.id) registerPush(api, nav, (msg) => toast(msg));
  }, [user?.id]); // eslint-disable-line

  return null;
}
