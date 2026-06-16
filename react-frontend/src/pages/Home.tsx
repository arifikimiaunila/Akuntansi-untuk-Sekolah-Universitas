import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PembayaranForm from '../components/PembayaranForm';

export default function Home() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    axios.get('/api/pembayaran').then((r) => setItems(r.data || []));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>SPP Payment (React)</h1>
      <PembayaranForm onSaved={(item) => setItems((s) => [item, ...s])} />

      <h2>Daftar Pembayaran</h2>
      <ul>
        {items.map((it) => (
          <li key={it.id}>{it.nis} - {it.jumlah_spp}</li>
        ))}
      </ul>
    </div>
  );
}
