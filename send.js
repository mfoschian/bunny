const MQ = require('./bunny');

const connection_info = {
	// protocol: 'amqp',
	// port: 5672,
	hostname: '172.18.35.42',
	vhost: 'psap2',
	username: 'psap2',
	password: 'psap2'
};

let q = new MQ(connection_info);

q.on('error', (err) => {
	console.error(err);
});



const exchange = {
	name: 'cards',
	type: 'fanout',
	options: { durable: true }
};

async function run() {
	try {
		const message = process.argv.slice(2).join(' ') || 'Hello World!';

		// const id = setTimeout( () => q.disconnect(), 5000 );

		const result = await q.send(message, exchange, { persistent: true } )
		console.log( "Sent message: '%s', result is %s", message, result);

		// clearTimeout(id);
		q.disconnect();
	}
	catch (e) {
		console.error('Error sending message:');
		console.error(e);
		q.disconnect();
	}

}

run();