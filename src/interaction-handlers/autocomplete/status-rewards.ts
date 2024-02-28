import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import type { AutocompleteInteraction } from 'discord.js';
import { getStatusRewards } from '../../lib/utils';

export class AutocompleteHandler extends InteractionHandler {
	public constructor(ctx: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
		super(ctx, {
			...options,
			interactionHandlerType: InteractionHandlerTypes.Autocomplete,
			name: 'status-rewards-autocomplete'
		});
	}

	public override async parse(interaction: AutocompleteInteraction) {
		if (interaction.commandName !== 'status-rewards') return this.none();

		const focusedOption = interaction.options.getFocused(true);
		if (focusedOption.name !== 'status') return this.none();
		return this.some(focusedOption);
	}

	public override async run(interaction: AutocompleteInteraction, result: InteractionHandler.ParseResult<this>) {
		const rewards = await getStatusRewards();
		return interaction.respond(
			rewards
				.filter((reward) => reward.text.startsWith(result.value))
				.slice(0, 25)
				.map((reward) => ({ name: reward.text, value: reward.text }))
		);
	}
}
