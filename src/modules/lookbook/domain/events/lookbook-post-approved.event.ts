export class LookbookPostApprovedEvent {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
  ) {}
}