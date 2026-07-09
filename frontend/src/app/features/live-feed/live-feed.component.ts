import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

import { FeedService } from '../../core/services/feed.service';

@Component({
  selector: 'app-live-feed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule],
  templateUrl: './live-feed.component.html',
  styleUrl: './live-feed.component.scss',
})
export class LiveFeedComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly feedService = inject(FeedService);

  readonly frame = this.feedService.frame;
  readonly connected = this.feedService.connected;

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (sessionId) {
      this.feedService.connect(sessionId);
    }
  }

  ngOnDestroy(): void {
    this.feedService.disconnect();
  }

  classEntries(): [string, number][] {
    const counts = this.frame()?.class_counts ?? {};
    return Object.entries(counts);
  }
}
