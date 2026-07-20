const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Desactivar caché para todas las respuestas
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

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
  let { delivered, paid } = req.body;

  // Convertir a booleanos si vienen como strings
  delivered = delivered === true || delivered === 'true';
  paid = paid === true || paid === 'true';

  console.log('\n🔵 PUT START: Actualizando pedido', id);
  console.log('   Valores:', { delivered, paid });
  console.log('   Tipos:', { delivered: typeof delivered, paid: typeof paid });

  // ANTES de actualizar
  const { data: beforeData } = await supabase
    .from('pedidos')
    .select('id, delivered, paid')
    .eq('id', id)
    .single();

  console.log('   ANTES:', beforeData);

  // ACTUALIZAR
  const { data: updateData, error: updateError } = await supabase
    .from('pedidos')
    .update({ delivered, paid })
    .eq('id', id)
    .select('id, clientName, items, totalPrice, delivered, paid, createdAt')
    .single();

  console.log('   Error al actualizar:', updateError?.message || 'ninguno');
  console.log('   Datos retornados por UPDATE:', updateData);

  if (updateError) {
    console.error('❌ Error:', updateError.message);
    return res.status(400).json({ error: updateError.message });
  }

  // VERIFICAR DESPUÉS de actualizar (hacer un SELECT adicional)
  const { data: afterData } = await supabase
    .from('pedidos')
    .select('id, delivered, paid')
    .eq('id', id)
    .single();

  console.log('   DESPUÉS:', afterData);
  console.log('   ¿Se guardó? ANTES:', beforeData?.delivered, '→ DESPUÉS:', afterData?.delivered);

  console.log('✅ PUT END: Retornando:', updateData);
  res.json(updateData);
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
