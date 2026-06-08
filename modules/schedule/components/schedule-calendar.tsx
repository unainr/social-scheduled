"use client";

import { enUS } from "date-fns/locale/en-US";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { ScheduledPost } from "../types";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: ScheduledPost;
};

type ScheduleCalendarProps = {
  posts: ScheduledPost[];
  onSelectPost: (post: ScheduledPost) => void;
};

const getEventTitle = (post: ScheduledPost) => {
  const platformLabel = post.platforms.join(", ");
  const preview =
    post.content.length > 42
      ? `${post.content.slice(0, 42).trim()}...`
      : post.content;

  return `${platformLabel}: ${preview}`;
};

export const ScheduleCalendar = ({
  posts,
  onSelectPost,
}: ScheduleCalendarProps) => {
  const events: CalendarEvent[] = posts
    .filter((post) => post.scheduledFor)
    .map((post) => {
      const start = new Date(post.scheduledFor!);

      return {
        id: post.id,
        title: getEventTitle(post),
        start,
        end: new Date(start.getTime() + 30 * 60 * 1000),
        resource: post,
      };
    });

  return (
    <div className="h-[640px] min-h-[520px] w-full">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .rbc-calendar {
              color: rgba(255,255,255,0.86);
              background: transparent;
              font-family: inherit;
            }
            .rbc-toolbar {
              gap: 12px;
              margin-bottom: 18px;
            }
            .rbc-toolbar button {
              color: rgba(255,255,255,0.68);
              background: rgba(255,255,255,0.04);
              border: 1px solid rgba(255,255,255,0.1);
              border-radius: 8px;
              padding: 7px 11px;
            }
            .rbc-toolbar button.rbc-active,
            .rbc-toolbar button:hover {
              background: rgba(200,241,53,0.12);
              border-color: rgba(200,241,53,0.45);
              color: #c8f135;
            }
            .rbc-toolbar-label {
              color: white;
              font-weight: 700;
            }
            .rbc-month-view,
            .rbc-time-view,
            .rbc-agenda-view {
              border-color: rgba(255,255,255,0.1);
              border-radius: 10px;
              overflow: hidden;
              background: rgba(255,255,255,0.025);
            }
            .rbc-header,
            .rbc-day-bg,
            .rbc-month-row,
            .rbc-time-content,
            .rbc-time-header-content,
            .rbc-timeslot-group {
              border-color: rgba(255,255,255,0.08);
            }
            .rbc-off-range-bg {
              background: rgba(255,255,255,0.025);
            }
            .rbc-today {
              background: rgba(200,241,53,0.07);
            }
            .rbc-event {
              border: 0;
              border-radius: 7px;
              background: #c8f135;
              color: #080808;
              font-size: 12px;
              font-weight: 700;
              padding: 3px 7px;
            }
            .rbc-event.failed {
              background: rgba(255,92,92,0.92);
              color: white;
            }
            .rbc-show-more {
              color: #c8f135;
              background: transparent;
            }
            .rbc-agenda-table {
              border-color: rgba(255,255,255,0.1);
            }
            .rbc-agenda-table tbody > tr > td {
              border-color: rgba(255,255,255,0.08);
            }
          `,
        }}
      />
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={["month", "week", "day", "agenda"]}
        defaultView="month"
        popup
        onSelectEvent={(event) => onSelectPost(event.resource)}
        eventPropGetter={(event) => ({
          className: event.resource.status === "failed" ? "failed" : "",
        })}
        style={{ height: "100%" }}
      />
    </div>
  );
};
