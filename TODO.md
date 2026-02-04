Atue como um Engenheiro de Software Senior especialista em integrações financeiras (FinTech).

Sua tarefa é implementar um serviço de consulta de taxa de câmbio (PTAX) utilizando a API Olinda do Banco Central do Brasil.

O sistema possui uma REGRA DE NEGÓCIO RÍGIDA sobre a data de referência:
**A cotação utilizada deve ser sempre referente à PRIMEIRA DATA do BIMESTRE ATUAL.**

### Requisitos Funcionais e Lógicos

1.  **Cálculo de Data Dinâmica (Smart Date Resolution):**
    * Crie um algoritmo que determine o início do bimestre atual com base na data de hoje (Jan/Fev -> 01/Jan, Mar/Abr -> 01/Mar, etc.).
    * **Problema Crítico:** A API do BC retorna vazio em feriados (ex: 1º de Janeiro) e fins de semana.
    * **Solução:** Implemente uma lógica de "Fall-forward". Se a requisição para o dia 01 retornar vazio (`value: []`), o sistema deve tentar automaticamente o dia 02, depois o 03, até encontrar o primeiro dia útil com cotação dentro daquele bimestre.

2.  **Arquitetura do Serviço:**
    * Encapsule a lógica em uma classe/serviço (ex: `BimonthlyExchangeService`).
    * O método público principal não deve pedir argumentos de data, ele deve ser auto-contido: `getCurrentBimonthlyRate()`.

3.  **Resiliência e Performance:**
    * **Cache Obrigatório:** Como a taxa do início do bimestre é um valor estático (uma vez fechada, nunca muda), implemente um cache agressivo (TTL longo). O sistema só deve bater na API do BC uma vez a cada dois meses (idealmente).
    * **Retry & Timeout:** Implemente exponential backoff para falhas de rede.

4.  **Segurança de Dados:**
    * Valide a resposta com Zod (ou equivalente) para garantir que `cotacaoVenda` é um número válido.
    * Tratamento de erro robusto: Lance exceções claras se, após tentar os primeiros 5 dias do mês, nenhuma taxa for encontrada.

### Input Técnico API
* **Endpoint:** `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)`
* **Parâmetro Query:** `@dataCotacao='MM-DD-YYYY'` (Atenção ao formato americano e às aspas simples na string da query).

Gere o código (preferencialmente em TypeScript/Node.js), incluindo a função auxiliar de cálculo de data e a lógica de retry para dias não úteis.

**Faça um endpoint no backend para ser consumido pelo frontend e no frontend faça a integração na parte Consulta taxa de câmbio banco central para que ele mostre a taxa de câmbio utilizando essa chamada de API que iremos desenvolvera.**