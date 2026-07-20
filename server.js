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
  const id = parseInt(req.params.id);
  const { delivered, paid } = req.body;

  console.log('\n🔵 PUT START: Actualizando pedido', id);
  console.log('   Valores:', { delivered, paid });
  console.log('   ID tipo:', typeof id);

  // Primero, obtener el pedido antes de actualizar
  const { data: beforeData } = await supabase
    .from('pedidos')
    .select('id, delivered, paid')
    .eq('id', id);

  console.log('   ANTES de actualizar:', beforeData?.[0]);

  const { data, error } = await supabase
    .from('pedidos')
    .update({ delivered, paid })
    .eq('id', id)
    .select('id, clientName, items, totalPrice, delivered, paid, createdAt');

  console.log('   Error de Supabase:', error?.message || 'ninguno');
  console.log('   Data retornada:', data);

  if (error) {
    console.error('❌ PUT: Error:', error.message);
    return res.status(400).json({ error: error.message });
  }

  if (!data || data.length === 0) {
    console.error('❌ PUT: No data returned');
    return res.status(400).json({ error: 'No data returned' });
  }

  console.log('✅ PUT END: Actualización exitosa:', data[0]);
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
