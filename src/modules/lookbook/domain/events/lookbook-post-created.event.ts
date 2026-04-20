export class LookbookPostCreatedEvent {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly imageUrl: string,
  ) {}
}
