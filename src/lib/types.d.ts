import jsoning from 'jsoning';

type StatusData = {
	text: string;
	type: StatusType;
	roleId: string;
	responsibleUserId: string;
};

type StatusType = 'case-sensitive' | 'case-insensitive';

declare module '@sapphire/framework' {
	interface Container {
		cache: StatusData[];
		db: jsoning;
	}
}
