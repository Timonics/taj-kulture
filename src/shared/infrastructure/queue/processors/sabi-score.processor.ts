import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserSabiScoreUpdatedEvent } from '../../../../modules/user/domain/events/user-sabi-score-updated.event';

@Processor('sabi-score')
export class SabiScoreProcessor {
  private readonly logger = new Logger(SabiScoreProcessor.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  @Process('add')
  async handleAdd(job: Job) {
    const { userId, points, reason } = job.data;
    this.logger.log(
      `Adding ${points} Sabi points to user ${userId} for reason: ${reason}`,
    );

    // Use transaction to read current score and update
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error(`User ${userId} not found`);
      const oldScore = user.sabiScore;
      const newScore = oldScore + points;
      const updated = await tx.user.update({
        where: { id: userId },
        data: { sabiScore: newScore },
      });
      // Emit event for real-time updates
      this.eventEmitter.emit(
        'user.sabiScore.updated',
        new UserSabiScoreUpdatedEvent(userId, oldScore, newScore, reason),
      );
      return updated;
    });

    this.logger.log(
      `User ${userId} Sabi score updated to ${updatedUser.sabiScore}`,
    );
    return { success: true, newScore: updatedUser.sabiScore };
  }
}
