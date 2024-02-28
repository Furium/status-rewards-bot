import './lib/setup';

import { LogLevel, SapphireClient, container } from '@sapphire/framework';
import { GatewayIntentBits } from 'discord.js';
import jsoning from 'jsoning';
import { StatusData } from './lib/types';

const cache: StatusData[] = [];
const db = new jsoning('database.json');

const client = new SapphireClient({
	logger: {
		level: process.env.NODE_ENV === 'production' ? LogLevel.Info : LogLevel.Debug
	},
	intents: [GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.Guilds]
});

const main = async () => {
	console.log(`* * * Furium's Status Rewards Bot * * *`);
	try {
		container.cache = cache;
		container.db = db;
		client.logger.info('Logging in');
		await client.login();
		client.logger.info('logged in');
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();
