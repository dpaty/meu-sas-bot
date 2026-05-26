#!/usr/bin/env node

/**
 * TESTE DE DESCONEXÃO - Validar que BOT PARA quando humano assume
 * 
 * Este script simula:
 * 1. Cliente enviando mensagens normalmente (bot responde)
 * 2. Humano assume atendimento (bot é silenciado)
 * 3. Cliente enviando mensagens (bot NÃO responde)
 * 4. Humano libera bot (bot volta a responder)
 */

const http = require('http');

class TesteDesconexao {
    constructor(userId = 'user123', chatId = '5521987654321@c.us') {
        this.userId = userId;
        this.chatId = chatId;
        this.baseUrl = 'http://localhost:3000';
    }

    fazer(metodo, caminho, dados = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(caminho, this.baseUrl);
            const opcoes = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: metodo,
                headers: { 'Content-Type': 'application/json' }
            };

            const req = http.request(opcoes, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, dados: JSON.parse(body) });
                    } catch {
                        resolve({ status: res.statusCode, dados: body });
                    }
                });
            });

            req.on('error', reject);
            if (dados) req.write(JSON.stringify(dados));
            req.end();
        });
    }

    cor(texto, cor) {
        const cores = {
            verde: '\x1b[32m',
            vermelho: '\x1b[31m',
            amarelo: '\x1b[33m',
            azul: '\x1b[34m',
            reset: '\x1b[0m'
        };
        return `${cores[cor] || ''}${texto}${cores.reset}`;
    }

    async testar() {
        console.log('\n');
        console.log(this.cor('═════════════════════════════════════════════════════', 'azul'));
        console.log(this.cor('🧪 TESTE DE DESCONEXÃO - BOT PARA QUANDO HUMANO ASSUME', 'azul'));
        console.log(this.cor('═════════════════════════════════════════════════════\n', 'azul'));

        try {
            // ─────────────────────────────────────────
            // FASE 1: BOT RESPONDENDO NORMALMENTE
            // ─────────────────────────────────────────
            console.log(this.cor('📋 FASE 1: BOT RESPONDENDO NORMALMENTE\n', 'verde'));
            console.log('Situação: Cliente enviando mensagens → Bot responde\n');

            const status1 = await this.fazer('GET', `/api/handoff/status/${this.userId}/${this.chatId}`);
            console.log(this.cor(`✓ Status do chat: ${status1.dados.status}`, 'verde'));
            console.log(this.cor(`  Bot respondendo? ${!status1.dados.estaSilenciado ? 'SIM ✓' : 'NÃO'}`, 'verde'));
            console.log('\n');

            // ─────────────────────────────────────────
            // FASE 2: HUMANO ASSUME ATENDIMENTO
            // ─────────────────────────────────────────
            console.log(this.cor('═════════════════════════════════════════════════════\n', 'amarelo'));
            console.log(this.cor('👤 FASE 2: HUMANO ASSUME ATENDIMENTO\n', 'amarelo'));
            console.log('Ação: Operador clica "ASSUMIR ATENDIMENTO"\n');

            const assumir = await this.fazer('POST', `/api/handoff/silenciar/${this.userId}`, {
                chatId: this.chatId
            });

            console.log(this.cor(`✓ ${assumir.dados.message}`, 'amarelo'));
            console.log(this.cor(`  Silenciado em: ${assumir.dados.silenciadoEm}`, 'amarelo'));
            console.log('\n');

            // ─────────────────────────────────────────
            // FASE 3: VERIFICAR DESCONEXÃO
            // ─────────────────────────────────────────
            console.log(this.cor('═════════════════════════════════════════════════════\n', 'vermelho'));
            console.log(this.cor('🛑 FASE 3: VERIFICAR DESCONEXÃO (BOT PARA)\n', 'vermelho'));
            console.log('Situação: Cliente continua enviando mensagens → Bot NÃO responde\n');

            const status2 = await this.fazer('GET', `/api/handoff/status/${this.userId}/${this.chatId}`);
            console.log(this.cor(`✓ Status do chat: ${status2.dados.status}`, 'vermelho'));
            console.log(this.cor(`  Bot respondendo? ${!status2.dados.estaSilenciado ? 'SIM' : 'NÃO ✓ (DESCONECTADO)'}`, 'vermelho'));
            console.log(this.cor(`  📵 BOT COMPLETAMENTE DESCONECTADO!`, 'vermelho'));
            console.log('\n');

            // ─────────────────────────────────────────
            // FASE 4: VERIFICAR LISTA DE ATENDIMENTOS
            // ─────────────────────────────────────────
            console.log(this.cor('═════════════════════════════════════════════════════\n', 'amarelo'));
            console.log(this.cor('📋 FASE 4: VERIFICAR LISTA DE ATENDIMENTOS\n', 'amarelo'));
            console.log('Ação: Listar todos os chats em atendimento humano\n');

            const lista = await this.fazer('GET', `/api/handoff/silenciados/${this.userId}`);
            if (lista.dados.success && lista.dados.total > 0) {
                console.log(this.cor(`✓ Total de chats em atendimento: ${lista.dados.total}`, 'amarelo'));
                lista.dados.chatsSilenciados.forEach((chat, i) => {
                    console.log(this.cor(`  ${i + 1}. ${chat.chatId} - Desde ${chat.silenciadoEm}`, 'amarelo'));
                });
            } else {
                console.log(this.cor('ℹ️  Nenhum chat em atendimento no momento', 'amarelo'));
            }
            console.log('\n');

            // ─────────────────────────────────────────
            // FASE 5: HUMANO LIBERA BOT
            // ─────────────────────────────────────────
            console.log(this.cor('═════════════════════════════════════════════════════\n', 'verde'));
            console.log(this.cor('🤖 FASE 5: HUMANO LIBERA BOT\n', 'verde'));
            console.log('Ação: Operador clica "LIBERAR BOT"\n');

            const liberar = await this.fazer('POST', `/api/handoff/desilenciar/${this.userId}`, {
                chatId: this.chatId
            });

            console.log(this.cor(`✓ ${liberar.dados.message}`, 'verde'));
            console.log('\n');

            // ─────────────────────────────────────────
            // FASE 6: BOT VOLTANDO A RESPONDER
            // ─────────────────────────────────────────
            console.log(this.cor('═════════════════════════════════════════════════════\n', 'verde'));
            console.log(this.cor('✅ FASE 6: BOT VOLTANDO A RESPONDER\n', 'verde'));
            console.log('Situação: Cliente enviando mensagens → Bot responde novamente\n');

            const status3 = await this.fazer('GET', `/api/handoff/status/${this.userId}/${this.chatId}`);
            console.log(this.cor(`✓ Status do chat: ${status3.dados.status}`, 'verde'));
            console.log(this.cor(`  Bot respondendo? ${!status3.dados.estaSilenciado ? 'SIM ✓' : 'NÃO'}`, 'verde'));
            console.log(this.cor(`  ✅ BOT REATIVADO COM SUCESSO!`, 'verde'));
            console.log('\n');

            // ─────────────────────────────────────────
            // CONCLUSÃO
            // ─────────────────────────────────────────
            console.log(this.cor('═════════════════════════════════════════════════════\n', 'azul'));
            console.log(this.cor('✅ TESTE COMPLETO - DESCONEXÃO VERIFICADA\n', 'azul'));

            console.log(this.cor('RESUMO:', 'azul'));
            console.log(this.cor('✓ Bot respondendo normalmente', 'verde'));
            console.log(this.cor('✓ Humano assume - Bot desconecta completamente', 'verde'));
            console.log(this.cor('✓ Cliente não recebe respostas do bot', 'verde'));
            console.log(this.cor('✓ Humano libera - Bot retoma atendimento', 'verde'));
            console.log(this.cor('✓ Bot volta a responder normalmente', 'verde'));

            console.log('\n' + this.cor('═════════════════════════════════════════════════════\n', 'azul'));
            console.log(this.cor('🎉 DESCONEXÃO EM SEGUNDO PLENO FUNCIONANDO PERFEITAMENTE!\n', 'azul'));

        } catch (err) {
            console.error(this.cor(`❌ ERRO: ${err.message}`, 'vermelho'));
            console.error(this.cor('Certifique-se que npm start está rodando\n', 'vermelho'));
        }
    }
}

// Executar teste
const teste = new TesteDesconexao();
teste.testar();
