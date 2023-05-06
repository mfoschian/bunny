let amqp = require('amqplib/callback_api');

const queue_name = 'seme';
const connect_url = "amqp://psap2:psap2@172.18.35.42/psap2";


function onMessage(msg) {
	if (msg.content) {
		console.log(" [x] %s", msg.content.toString());
	}
	else
		console.log(" [x] <message without content>" );
}


// listening
async function listen() {
	return new Promise((resolve, reject) => {
		amqp.connect(connect_url, function (error0, connection) {
			if (error0) {
				reject(error0);
				return;
			}

			connection.createChannel(function (error1, channel) {
				if (error1) {
					reject(error1);
					return;
				}

				const queue_opts = {
					durable: true,
					exclusive: false
				};
				channel.assertQueue(queue_name, queue_opts, function (errorq, q) {
					if (errorq) {
						reject(errorq);
						return;
					}
	
					channel.consume(q.queue, function( msg ) {
						if(msg.content && msg.content.toString() == 'bye' ) {
							connection.close();
							resolve();
						}
						else
							onMessage( msg );
					}, {noAck: true});
				});

			});


		});
	})
}


async function run() {
	try {
		console.log('Listening...')
		await listen();
		console.log('Bye, bye')
	}
	catch (e) {
		console.error('Error sending message:');
		console.error(e);
	}

}

run();