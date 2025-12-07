import { Dialog } from "@base-ui-components/react/dialog";
import { marked } from "marked";
import type { Event } from "./event-section.astro";
import { TimeLeft } from "./time-left";

export function EventDialog({ event }: { event: Event }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="text-right text-typography-link hover:bg-black/50 duration-200 hover:cursor-pointer">
        ver más
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 min-h-dvh bg-black opacity-20 transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:opacity-70 supports-[-webkit-touch-callout:none]:absolute z-20" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -mt-8 w-96 max-w-[calc(100vw-3rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-neutral-900 p-4 text-[var(--color-typography)] outline outline-1 outline-neutral-700 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 z-30">
          <Dialog.Title className="-mt-1.5 mb-1 text-lg font-medium font-serif text-[var(--color-typography)]">
            {event.title}
          </Dialog.Title>
          <Dialog.Description
            className="prose prose-sm prose-invert max-w-none mb-4 text-sm text-[var(--color-typography)] font-sans prose-headings:font-serif max-h-72 overflow-y-auto pr-2"
            dangerouslySetInnerHTML={{ __html: marked.parse(event.content) }}
          />
          <TimeLeft startDate={event.startDate} />
          <div className="flex justify-end gap-4">
            <Dialog.Close className="hover:cursor-pointer">cerrar</Dialog.Close>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
