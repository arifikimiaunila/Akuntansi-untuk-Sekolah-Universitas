import React, { useState } from 'react';
import axios from 'axios';

export default function PembayaranForm({ onSaved }: { onSaved?: (item: any) => void }) {
  const [nis, setNis] = useState('');
  const [jumlah, setJumlah] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resp = await axios.post('/api/pembayaran', { nis, jumlah_spp: jumlah });
    if (resp.data && resp.data.data) onSaved?.(resp.data.data);
    setNis('');
    setJumlah(0);
  };

  return (
    <form onSubmit={submit} style={{ marginBottom: 20 }}>
      <div>
        <label>NIS</label>
        <input value={nis} onChange={(e) => setNis(e.target.value)} />
      </div>
      <div>
        <label>Jumlah</label>
        <input type="number" value={jumlah} onChange={(e) => setJumlah(Number(e.target.value))} />
      </div>
      <button type="submit">Simpan</button>
    </form>
  );
}
