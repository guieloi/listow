// Script para testar as correções implementadas
const axios = require('axios');

const API_BASE = 'http://localhost:8085/api';

async function testLoginErrors() {
  console.log('\n🔐 Testando correções de erro no login...\n');
  
  try {
    // Teste 1: Usuário inexistente
    console.log('1. Testando usuário inexistente...');
    await axios.post(`${API_BASE}/auth/login`, {
      email: 'usuario_inexistente@teste.com',
      password: 'senha123'
    });
  } catch (error) {
    console.log('✅ Resposta para usuário inexistente:', error.response?.data);
  }
  
  try {
    // Teste 2: Senha incorreta para usuário existente (se existir)
    console.log('\n2. Testando senha incorreta para ana@luiza.com...');
    await axios.post(`${API_BASE}/auth/login`, {
      email: 'ana@luiza.com',
      password: 'senha_errada'
    });
  } catch (error) {
    console.log('✅ Resposta para senha incorreta:', error.response?.data);
  }
}

async function testSharedLists() {
  console.log('\n📋 Testando listas compartilhadas...\n');
  
  // Primeiro, vamos tentar fazer login com ana@luiza.com para obter o token
  let anaToken = null;
  try {
    console.log('1. Tentando login com ana@luiza.com...');
    const anaLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'ana@luiza.com',
      password: 'senha123' // Assumindo uma senha padrão
    });
    anaToken = anaLogin.data.token;
    console.log('✅ Login da Ana bem-sucedido');
  } catch (error) {
    console.log('❌ Erro no login da Ana:', error.response?.data);
    console.log('   (Usuário pode não existir ainda)');
  }
  
  // Tentar login com guieloi@Hotmail.com
  let guieloiToken = null;
  try {
    console.log('\n2. Tentando login com guieloi@Hotmail.com...');
    const guieloiLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'guieloi@Hotmail.com',
      password: 'senha123'
    });
    guieloiToken = guieloiLogin.data.token;
    console.log('✅ Login do Guieloi bem-sucedido');
    
    // Buscar listas do Guieloi
    console.log('\n3. Buscando listas do Guieloi...');
    const guieloiLists = await axios.get(`${API_BASE}/lists`, {
      headers: { Authorization: `Bearer ${guieloiToken}` }
    });
    console.log('✅ Listas encontradas para Guieloi:', guieloiLists.data.length);
    guieloiLists.data.forEach((list, index) => {
      console.log(`   ${index + 1}. ${list.name} (Role: ${list.user_role}, Owner: ${list.is_owner})`);
    });
    
  } catch (error) {
    console.log('❌ Erro no login do Guieloi:', error.response?.data);
    console.log('   (Usuário pode não existir ainda)');
  }
}

async function runTests() {
  console.log('🧪 Iniciando testes das correções...');
  
  await testLoginErrors();
  await testSharedLists();
  
  console.log('\n✅ Testes concluídos!');
}

runTests().catch(console.error);