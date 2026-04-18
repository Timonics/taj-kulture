export class UserSabiScoreUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly oldScore: number,
    public readonly newScore: number,
    public readonly reason: string,
  ) {}
}