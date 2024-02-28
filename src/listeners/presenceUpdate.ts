import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { ActivityType, Presence } from 'discord.js';
import { getStatusReward, log } from '../lib/utils';

@ApplyOptions<Listener.Options>({ event: Events.PresenceUpdate })
export class UserEvent extends Listener {
	public override async run(oldPresence: Presence, newPresence: Presence) {
		// Get custom status text
		const oldStatus = oldPresence?.activities.find((activity) => activity.type === ActivityType.Custom);
		const newStatus = newPresence?.activities.find((activity) => activity.type === ActivityType.Custom);

		// If the status text has changed
		if (oldStatus && newStatus && oldStatus.state !== newStatus.state) {
			this.container.logger.info(`User ${newPresence.user?.tag} changed their status from "${oldStatus.state}" to "${newStatus.state}"`);

			const reward = await getStatusReward(newStatus.state!);
			if (reward) {
				await newPresence.member?.roles.add(reward);
				log(newPresence.userId, 'add', newStatus.state!, reward);
				this.container.logger.info(`User ${newPresence.user?.tag} was given the role ${reward}`);
			}

			const oldReward = await getStatusReward(oldStatus.state!);
			if (oldReward) {
				await newPresence.member?.roles.remove(oldReward);
				log(newPresence.userId, 'remove', oldStatus.state!, oldReward);
				this.container.logger.info(`User ${newPresence.user?.tag} was removed the role ${oldReward}`);
			}
		}

		// if set new custom status but didn't have any before
		if (!oldStatus && newStatus) {
			this.container.logger.info(`User ${newPresence.user?.tag} set their status to "${newStatus?.state}"`);

			const reward = await getStatusReward(newStatus.state!);
			if (reward) {
				await newPresence.member?.roles.add(reward);
				log(newPresence.userId, 'add', newStatus.state!, reward);
				this.container.logger.info(`User ${newPresence.user?.tag} was given the role ${reward}`);
			}
		}

		// if removed custom status
		if (oldStatus && !newStatus) {
			this.container.logger.info(`User ${newPresence.user?.tag} removed their status`);

			const oldReward = await getStatusReward(oldStatus.state!);
			if (oldReward) {
				await newPresence.member?.roles.remove(oldReward);
				log(oldPresence.userId, 'remove', oldStatus.state!, oldReward);
				this.container.logger.info(`User ${newPresence.user?.tag} was removed the role ${oldReward}`);
			}
		}
	}
}
