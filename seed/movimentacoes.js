const knex = require('../src/config/connect');

const { faker } = require('@faker-js/faker');

(async () => {
    await knex('movimentacoes').delete();
    for (let i = 0; i < 10_000; i++) {
        let pedido_id = await knex('pedidos').select('id').orderByRaw('random()').limit(1).then(rows => rows[0].id);
        let saque_id = await knex('saques').select('id').orderByRaw('random()').limit(1).then(rows => rows[0].id);
        const random = Math.random();
        if (random > 0.5) {
            pedido_id = null;
        } else {
            saque_id = null;
        }
        try {
            const res = await knex('movimentacoes').insert({
                tipo: random > 0.5 ? 'entrada' : 'saída',
                valor: faker.number.int({ min: 1, max: 1000 }),
                datarealizado: faker.date.past().toISOString().split('T')[0],
                pedido_id: pedido_id,
                saque_id: saque_id,
            });
        } catch (err) {
            console.log('err', i)
            continue;
        }
        if (i % 1000 === 0) {
            console.log(`Inseridos ${i} movimentações`);
        }
    }
})().then(() => {
    console.log('Movimentações inseridas com sucesso!');
    process.exit(0);
})