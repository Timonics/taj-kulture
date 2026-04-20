export class ReviewCreatedEvent {
  constructor(
    public readonly reviewId: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly rating: number,
    public readonly hasAudio: boolean,
    public readonly hasComment: boolean,
  ) {}
}
