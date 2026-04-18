export class UserReferredEvent {
  constructor(
    public readonly referrerId: string,
    public readonly referredId: string,
    public readonly referredEmail: string,
  ) {}
}