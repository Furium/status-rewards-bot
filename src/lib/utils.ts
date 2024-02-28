import type { ChatInputCommandSuccessPayload, Command, ContextMenuCommandSuccessPayload, MessageCommandSuccessPayload } from '@sapphire/framework';
import { container } from '@sapphire/framework';
import { cyan } from 'colorette';
import { EmbedBuilder, type APIUser, type Guild, type User, ColorResolvable, TextChannel } from 'discord.js';
import config from '../../config.json';
import { StatusData, StatusType } from './types';

export function logSuccessCommand(payload: ContextMenuCommandSuccessPayload | ChatInputCommandSuccessPayload | MessageCommandSuccessPayload): void {
	let successLoggerData: ReturnType<typeof getSuccessLoggerData>;

	if ('interaction' in payload) {
		successLoggerData = getSuccessLoggerData(payload.interaction.guild, payload.interaction.user, payload.command);
	} else {
		successLoggerData = getSuccessLoggerData(payload.message.guild, payload.message.author, payload.command);
	}

	container.logger.debug(`${successLoggerData.shard} - ${successLoggerData.commandName} ${successLoggerData.author} ${successLoggerData.sentAt}`);
}

export function getSuccessLoggerData(guild: Guild | null, user: User, command: Command) {
	const shard = getShardInfo(guild?.shardId ?? 0);
	const commandName = getCommandInfo(command);
	const author = getAuthorInfo(user);
	const sentAt = getGuildInfo(guild);

	return { shard, commandName, author, sentAt };
}

function getShardInfo(id: number) {
	return `[${cyan(id.toString())}]`;
}

function getCommandInfo(command: Command) {
	return cyan(command.name);
}

function getAuthorInfo(author: User | APIUser) {
	return `${author.username}[${cyan(author.id)}]`;
}

function getGuildInfo(guild: Guild | null) {
	if (guild === null) return 'Direct Messages';
	return `${guild.name}[${cyan(guild.id)}]`;
}

/**
 * Gets the rewards from the cache if exists, otherwise fetches from the database
 * @returns the map of status to roleId
 */
export async function getStatusRewards() {
	if (container.cache.length > 0) {
		return container.cache;
	}

	const rewards: StatusData[] = Object.values(await container.db.all());
	container.logger.debug(rewards);
	container.cache = [];

	for (const reward of rewards) {
		container.cache.push({
			text: reward.text,
			roleId: reward.roleId,
			responsibleUserId: reward.responsibleUserId,
			type: reward.type
		});
	}

	return container.cache;
}

/**
 * gets the reward (roleId) for the status if exists
 * @param status
 */
export async function getStatusReward(status: string): Promise<string | null> {
	const rewards = await getStatusRewards();
	let reward = rewards.find((reward) => reward.text.toLowerCase() === status.toLowerCase());

	if (reward?.type === 'case-sensitive') {
		return reward.roleId;
	}

	reward = rewards.find((reward) => reward.text === status);
	return reward?.roleId ?? null;
}

/**
 * Adds a reward for the status to the cache and the database
 * @param text
 * @param roleId
 * @param responsibleUserId
 * @param type
 */
export async function addStatusReward(text: string, roleId: string, responsibleUserId: string, type: StatusType) {
	const reward: StatusData = {
		text,
		roleId,
		responsibleUserId,
		type
	};

	container.cache.push(reward);
	await container.db.set(text, reward);
}

/**
 * Removes the reward for the status from the cache and the database
 * @param text
 */
export async function removeStatusReward(text: string) {
	container.cache = container.cache.filter((reward) => reward.text.toLowerCase() !== text.toLowerCase());
	await container.db.delete(text);
}

/**
 * Clears all data from the cache
 */
export async function flushCache() {
	container.cache = [];
}

export function log(userId: string, type: 'add' | 'remove', status: string, roleId: string) {
	const guild = container.client.guilds.cache.get(config.guildId);
	const channel = guild?.channels.cache.get(config.logChannelId) as TextChannel;

	const embed = new EmbedBuilder()
		.setFooter({ text: config.brandName })
		.setTimestamp()
		.setColor(config.mainColor as ColorResolvable)
		.setTitle(type === 'add' ? 'Status Reward Added' : 'Status Reward Removed')
		.setDescription(`**User:** <@${userId}>\n**Status:** ${status}\n**Role:** <@&${roleId}>`);

	channel?.send({ embeds: [embed] });
}
