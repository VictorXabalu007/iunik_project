const knex = require('../src/config/connect');

const { faker } = require('@faker-js/faker');

(async () => {
    for (let i = 0; i < 10_000; i++) {
        const random = Math.random();
        await knex('movimentacoes').insert({
            tipo: random > 0.5 ? 'entrada' : 'saída',
            valor: faker.number.int({ min: 1, max: 1000 }),
            datarealizado: faker.date.past().toISOString().split('T')[0]
        });
        if (i % 1000 === 0) {
            console.log(`Inseridos ${i} movimentações`);
        }
    }
})().then(() => {
    console.log('Movimentações inseridas com sucesso!');
    process.exit(0);
})