export class UserRegisteredEvent {
  public readonly occurredOn: Date;
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly phone: string | null,
    public readonly fullName: string,
  ) {
    this.occurredOn = new Date();
  }
}