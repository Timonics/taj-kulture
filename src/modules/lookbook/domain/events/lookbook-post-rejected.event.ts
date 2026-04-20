export class LookbookPostRejectedEvent {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly reason?: string,
  ) {}
}
