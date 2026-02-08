import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TestAttempt } from '../entities/test-attempt.entity';
import { Test } from '../entities/test.entity';
import { User, GlobalStatus } from '../../users/entities/user.entity';
import { EmailService } from '../../../common/services/email.service';

@Injectable()
export class TestService {
  constructor(
    @InjectRepository(TestAttempt)
    private readonly attemptRepo: Repository<TestAttempt>,
    @InjectRepository(Test)
    private readonly testRepo: Repository<Test>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async submitTestAttempt(
    userId: string,
    testId: string,
    score: number,
    answers: any,
    feedback?: string,
    clubId?: string,
  ) {
    const test = await this.testRepo.findOne({ where: { id: testId } });
    if (!test) throw new BadRequestException('Test not found');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const passed = score >= (test.passingScore || 60);
    const attempt = this.attemptRepo.create({
      user,
      test,
      score,
      passed,
      answers,
      feedback,
      clubId,
      attemptedAt: new Date(),
      completedAt: new Date(),
      correctedByAI: true,
    });
    await this.attemptRepo.save(attempt);

    if (test.type === 'CREATOR_TEST') {
      if (passed) {
        await this.emailService.sendUserCreatedEmail({
          to: user.email,
          username: user.name,
          temporaryPassword: '',
          role: 'CREATOR',
        });
        // Send wait for admin approval email
      } else {
        // Send retry email after one day
        await this.emailService.sendUserCreatedEmail({
          to: user.email,
          username: user.name,
          temporaryPassword: '',
          role: 'CREATOR',
        });
      }
    } else if (test.type === 'MEMBER_TEST') {
      if (passed) {
        user.globalStatus = GlobalStatus.ACTIVE;
        await this.userRepo.save(user);
        // Send account activated email
        await this.emailService.sendUserCreatedEmail({
          to: user.email,
          username: user.name,
          temporaryPassword: '',
          role: 'MEMBER',
        });
      }
    }
    return attempt;
  }
}
