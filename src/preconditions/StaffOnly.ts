import { AllFlowsPrecondition } from '@sapphire/framework';
import type { CommandInteraction, ContextMenuCommandInteraction, GuildMember, Message } from 'discord.js';
import config from '../../config.json';

const STAFF = config.staff;

export class UserPrecondition extends AllFlowsPrecondition {
	#message = 'This command can only be used by the staff.';

	public override chatInputRun(interaction: CommandInteraction) {
		const member = interaction.guild!.members.cache.get(interaction.user.id)!;
		return this.doStaffCheck(member);
	}

	public override contextMenuRun(interaction: ContextMenuCommandInteraction) {
		const member = interaction.guild!.members.cache.get(interaction.user.id)!;
		return this.doStaffCheck(member);
	}

	public override messageRun(message: Message) {
		return this.doStaffCheck(message.member!);
	}

	private doStaffCheck(member: GuildMember) {
		if (member.roles.cache.some((role) => STAFF.includes(role.id))) {
			return this.ok();
		}

		return this.error({ message: this.#message });
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		StaffOnly: never;
	}
}
