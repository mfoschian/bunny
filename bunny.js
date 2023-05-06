let amqp = require('amqplib');

async function sleep(secs) {
	await new Promise((resolve) => setTimeout( () => resolve(), secs*1000));
}


class MQ {
	constructor( cnn_info ) {
		this.connection_info = cnn_info || {};
		this.connection = null;
		this.channel = null;

		this.callbacks = {};
	}

	on(event_name, cbk) {
		if( typeof(cbk) != 'function')
			return;
		this.callbacks[event_name] = cbk;
	}

	emit(event_name, args) {
		const cbk = this.callbacks[event_name];
		if(!cbk) 
			return;
		try {
			return cbk(args);
		}
		catch( err ) {
			console.error( err );
			return;
		}
	}

	async connect() {
		if( this.connection )
			return this.connection;
		
		this.connection = await amqp.connect(this.connection_info);
		return this.connection;
	}

	async disconnect() {
		if( this.channel != null ) {
			await this.channel.close(); // needed to force pending messages send
			this.channel = null;
		}

		if( this.connection != null ) {
			await this.connection.close();
			this.connection = null;
		}
	}

	async listen( queue ) {
		// queue is { name, options: { durable, exclusive, ... }}
		try {
			await this.connect();
			this.channel = await this.connection.createChannel();
	
			let q = await this.channel.assertQueue(queue.name, queue.options);

			this.channel.consume(q.queue, (msg) => this.emit('message', msg), { noAck: true });
		}
		catch( e ) {
			console.error( e );
		}
	}

	async send( message, exchange, options ) {
		// exchange is { name, type, options: { durable, exclusive, ... }}
		// options is { timeout, persistent }
		const opts = options || {};
		// const DEFAULT_TIMEOUT = 10; // seconds
		// const timeout = (isNaN(opts.timeout) ? DEFAULT_TIMEOUT : Number(opts.timeout));
		// const timeout_ms = (timeout < 0 ? DEFAULT_TIMEOUT : timeout) * 1000;

		let timeout_id = null;
		let channel = null;

		const close = async () => {
			if( timeout_id != null )
				clearTimeout(timeout_id);
	
			if( channel ) {
				await channel.close(); // needed to force pending messages send
				channel = null;
			}
		};

		try {
			await this.connect();
			channel = await this.connection.createChannel();
			await channel.assertExchange(exchange.name, exchange.type || 'direct', exchange.options);
	
			const result = channel.publish(exchange.name, '', Buffer.from(message), {persistent: (opts.persistent == true ? true : false)});
			if( result != true ) {
				// Must wait the drain event
				console.log('waiting drain');
				await new Promise((resolve) => channel.once('drain', () => resolve()));
			}

			await close();
			return true;
		}
		catch( err ) {
			console.error( err );
			await close();
			return false;
		}		
	}
}

module.exports = MQ;