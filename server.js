const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Conectar a Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// OBTENER TODOS LOS PEDIDOS
app.get('/api/pedidos', async (req, res) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*');

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// CREAR UN NUEVO PEDIDO
app.post('/api/pedidos', async (req, res) => {
  const { clientName, items, totalPrice } = req.body;

  // Insertar y luego obtener todos los campos incluyendo id
  const { data: insertData, error: insertError } = await supabase
    .from('pedidos')
    .insert([{ clientName, items, totalPrice }])
    .select('id, clientName, items, totalPrice, delivered, paid, createdAt');

  if (insertError) {
    console.error('Error insertando:', insertError);
    return res.status(400).json({ error: insertError.message });
  }

  if (!insertData || insertData.length === 0) {
    return res.status(400).json({ error: 'No se retornaron datos' });
  }

  const result = insertData[0];
  console.log('✅ Pedido creado con ID:', result.id);
  res.json(result);
});

// ACTUALIZAR PEDIDO (marcar como entregado/cobrado)
app.put('/api/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  const { delivered, paid } = req.body;

  const { data, error } = await supabase
    .from('pedidos')
    .update({ delivered, paid })
    .eq('id', id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data[0]);
});

// BORRAR PEDIDO
app.delete('/api/pedidos/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Pedido borrado' });
});

// SERVIDOR ESCUCHANDO
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor Chipayé corriendo en puerto ${PORT}`);
});
