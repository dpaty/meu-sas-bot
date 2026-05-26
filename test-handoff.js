#!/usr/bin/env node

/**
 * test-handoff.js
 * 
 * Script de teste para validar o sistema de handoff
 * 
 * Uso: node test-handoff.js
 */

const http = require('http');

class TesteHandoff {
    constructor(userId = 'user123', chatId = '5521987654321@c.us') {
        this.userId = userId;
        this.chatId = chatId;
        this.baseUrl = 'http://localhost:3000';
    }

    /**
     * Fazer requisição HTTP
     */
    fazer(metodo, caminho, dados = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(caminho, this.baseUrl);
            const opcoes = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: metodo,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(opcoes, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        resolve({
                            status: res.statusCode,
                            dados: JSON.parse(body)
                        });
                    } catch {
                        resolve({
                            status: res.statusCode,
                            dados: body
                        });
                    }
                });
            });

            req.on('error', reject);
            if (dados) req.write(JSON.stringify(dados));
            req.end();
        });
    }

    /**
     * Log colorido
     */
    log(titulo, dados, ok = true) {
        const cor = ok ? '\x1b[32m' : '\x1b[31m';
        const reset = '\x1b[0m';
        console.log(`${cor}✓${reset} ${titulo}`);
        console.log(JSON.stringify(dados, null, 2));
        console.log('');
    }

    /**
     * Executar testes
     */
    async testar() {
        console.log('\n🧪 INICIANDO TESTES DE HANDOFF\n');

        try {
            // Teste 1: Listar atendimentos iniciais
            console.log('📋 TESTE 1: Listar atendimentos (inicial)\n');
            const inicial = await this.fazer('GET', `/api/handoff/silenciados/${this.userId}`);
            this.log('Resposta:', inicial.dados);

            // Teste 2: Assumir atendimento
            console.log('👤 TESTE 2: Assumir atendimento\n');
            const assumir = await this.fazer('POST', `/api/handoff/silenciar/${this.userId}`, {
                chatId: this.chatId
            });
            this.log('Resposta:', assumir.dados);

            // Teste 3: Verificar status
            console.log('📊 TESTE 3: Verificar status\n');
            const status = await this.fazer('GET', `/api/handoff/status/${this.userId}/${this.chatId}`);
            this.log('Resposta:', status.dados);

            // Teste 4: Listar atendimentos (com bot silenciado)
            console.log('📋 TESTE 4: Listar atendimentos (após silenciar)\n');
            const comSilencio = await this.fazer('GET', `/api/handoff/silenciados/${this.userId}`);
            this.log('Resposta:', comSilencio.dados);

            // Teste 5: Liberar bot
            console.log('🤖 TESTE 5: Liberar bot\n');
            const liberar = await this.fazer('POST', `/api/handoff/desilenciar/${this.userId}`, {
                chatId: this.chatId
            });
            this.log('Resposta:', liberar.dados);

            // Teste 6: Verificar status final
            console.log('📊 TESTE 6: Verificar status (após liberar)\n');
            const statusFinal = await this.fazer('GET', `/api/handoff/status/${this.userId}/${this.chatId}`);
            this.log('Resposta:', statusFinal.dados);

            // Teste 7: Estado geral
            console.log('📈 TESTE 7: Estado geral de atendimentos\n');
            const estado = await this.fazer('GET', `/api/handoff/estado/${this.userId}`);
            this.log('Resposta:', estado.dados);

            console.log('\n✅ TODOS OS TESTES EXECUTADOS COM SUCESSO!\n');

        } catch (err) {
            console.error('\n❌ ERRO:', err.message);
            console.error('Certifique-se que o servidor está rodando: npm start\n');
        }
    }
}

// Executar testes
const teste = new TesteHandoff();
teste.testar();
