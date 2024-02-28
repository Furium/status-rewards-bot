import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { addStatusReward, getStatusRewards, removeStatusReward } from '../../lib/utils';
import { ColorResolvable, EmbedBuilder } from 'discord.js';
import config from '../../../config.json';
import { PaginatedMessage } from '@sapphire/discord.js-utilities';
import { StatusType } from '../../lib/types';

@ApplyOptions<Subcommand.Options>({
	description: 'Status reawrds command',
	preconditions: ['StaffOnly'],
	subcommands: [
		{
			name: 'list',
			chatInputRun: 'list',
			default: true
		},
		{
			name: 'add',
			chatInputRun: 'add'
		},
		{
			name: 'remove',
			chatInputRun: 'remove'
		}
	]
})
export class StatusRewardCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand((option) =>
			option //
				.setName(this.name)
				.setDescription(this.description)
				.addSubcommand((subcommand) =>
					subcommand //
						.setName('list')
						.setDescription('List all status rewards')
				)
				.addSubcommand((subcmd) =>
					subcmd //
						.setName('add')
						.setDescription('Add a status reward')
						.addStringOption((opt) => opt.setName('status').setDescription('The status to add').setRequired(true))
						.addRoleOption((opt) => opt.setName('role').setDescription('The role to give if user sets this status').setRequired(true))
						.addStringOption((opt) =>
							opt
								.setName('match-type')
								.setDescription('Match type')
								.setChoices(
									{ name: 'CaSe-SeNsItIvE', value: 'case-sensitive' },
									{ name: 'case-insensitive', value: 'case-insensitive' }
								)
								.setRequired(true)
						)
				)
				.addSubcommand((subcmd) =>
					subcmd //
						.setName('remove')
						.setDescription('Remove a status reward')
						.addStringOption((opt) =>
							opt.setName('status').setDescription('The status to remove').setRequired(true).setAutocomplete(true)
						)
				)
		);
	}

	public async list(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		const rewards = await getStatusRewards();

		const baseEmbed = new EmbedBuilder()
			.setColor(config.mainColor as ColorResolvable)
			.setTitle('Status Rewards')
			.setFooter({ text: ` ${config.brandName}` })
			.setTimestamp();

		if (!rewards.length) {
			baseEmbed.setDescription(`Emptiness... There are no status rewards.`);
			return interaction.editReply({ embeds: [baseEmbed] });
		}

		const paginatedMessage = new PaginatedMessage({
			template: baseEmbed
		});

		let currentPage = '';
		let itemCount = 0;

		for (const reward of rewards) {
			const rewardText = `**Status:** ${reward.text}\n**Role:** <@&${reward.roleId}>\n**Added by:** <@${reward.responsibleUserId}>\n\n`;

			if (itemCount >= 5) {
				paginatedMessage.addPageEmbed((embed) => embed.setDescription(currentPage));
				currentPage = rewardText;
				itemCount = 1;
			} else {
				currentPage += rewardText;
				itemCount++;
			}
		}

		if (currentPage.length) {
			paginatedMessage.addPageEmbed((embed) => embed.setDescription(currentPage));
		}

		await paginatedMessage.run(interaction);
		return rewards;
	}

	public async add(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		let status = interaction.options.getString('status', true);
		const role = interaction.options.getRole('role', true);
		const matchType = interaction.options.getString('match-type', true) as StatusType;

		const rewards = await getStatusRewards();
		if (matchType === 'case-insensitive') status = status.toLowerCase();

		const baseEmbed = new EmbedBuilder()
			.setColor(config.mainColor as ColorResolvable)
			.setTitle('Status Rewards')
			.setFooter({ text: config.brandName })
			.setTimestamp();

		const reward = rewards.find((r) => r.text === status);
		if (reward)
			return interaction.editReply({
				embeds: [
					baseEmbed //
						.setDescription(`The status \`${status}\` already has a reward.`)
				]
			});

		await addStatusReward(matchType === 'case-insensitive' ? status.toLowerCase() : status, role.id, interaction.user.id, matchType);
		return interaction.editReply({
			embeds: [
				baseEmbed //
					.setDescription(`The status \`${status}\` has been added with the role <@&${role.id}>`)
			]
		});
	}

	public async remove(interaction: Subcommand.ChatInputCommandInteraction) {
		await interaction.deferReply({ ephemeral: true });
		let status = interaction.options.getString('status', true);
		const rewards = await getStatusRewards();

		const baseEmbed = new EmbedBuilder()
			.setColor(config.mainColor as ColorResolvable)
			.setTitle('Status Rewards')
			.setFooter({ text: config.brandName })
			.setTimestamp();

		const reward = rewards.find((r) => r.text === status);
		if (!reward)
			return interaction.editReply({
				embeds: [
					baseEmbed //
						.setDescription(`The status \`${status}\` does not have a reward.`)
				]
			});

		await removeStatusReward(reward.text);
		return interaction.editReply({
			embeds: [
				baseEmbed //
					.setDescription(`The status \`${status}\` has been removed.`)
			]
		});
	}
}
