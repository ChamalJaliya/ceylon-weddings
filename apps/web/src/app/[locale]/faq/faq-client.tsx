"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Reveal } from "@ceylonweddings/ui/domain/motion";
import { AnimateIcon, Icon } from "@ceylonweddings/ui/components/icon";

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border/50">
      <AnimateIcon animateOnHover animateOnTap asChild>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-6 text-left focus:outline-none"
      >
        <span className="font-medium text-lg pr-8">{question}</span>
        <Icon
          icon={ChevronDown}
          size="md"
          className={`text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      </AnimateIcon>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100 pb-6" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export function FAQClient() {
  return (
    <div className="mx-auto max-w-3xl space-y-16 pb-24">
      <Reveal>
        <section>
          <h2 className="font-serif text-3xl font-medium mb-6 text-foreground">For couples</h2>
          <div className="flex flex-col">
            <FAQItem
              question="Is Ceylon Weddings free for couples?"
              answer="Yes — all planning tools (checklist, budget, guest list, website) are free forever."
            />
            <FAQItem
              question="What ceremony types do you support?"
              answer="Poruwa, church, nikah, walima, homecoming — add as many as your wedding needs."
            />
            <FAQItem
              question="How does WhatsApp inquire work?"
              answer="When you tap Inquire on a vendor, we save the lead and open WhatsApp pre-filled with your wedding details. The conversation continues on WhatsApp."
            />
            <FAQItem
              question="Can family members use my planning hub?"
              answer="Yes — invite your partner, Amma, a planner, or family members with different permission levels."
            />
            <FAQItem
              question="Is there an app?"
              answer="The website is mobile-optimised. A native app is on the roadmap."
            />
            <FAQItem
              question="Can I plan from overseas?"
              answer="Yes — many couples use us from the UK, UAE, Australia, and beyond. Mark 'Planning from overseas' in your profile."
            />
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.1}>
        <section>
          <h2 className="font-serif text-3xl font-medium mb-6 text-foreground">For vendors</h2>
          <div className="flex flex-col">
            <FAQItem
              question="How much does it cost to list?"
              answer="Listing is free. There are no booking fees or commission charges."
            />
            <FAQItem
              question="How do I get inquiries?"
              answer="Couples browse your listing and tap 'Inquire' — you receive a WhatsApp message with their wedding details."
            />
            <FAQItem
              question="How do I get a verified badge?"
              answer="Our team manually verifies active listings. Submit your business registration and we will review within 3 working days."
            />
            <FAQItem
              question="Can I list multiple services?"
              answer="Each listing covers one category. Contact us to discuss multiple listings."
            />
            <FAQItem
              question="How do I update my listing?"
              answer="Log in to your vendor dashboard at /pro/storefront."
            />
          </div>
        </section>
      </Reveal>

      <Reveal delay={0.2}>
        <section>
          <h2 className="font-serif text-3xl font-medium mb-6 text-foreground">General</h2>
          <div className="flex flex-col">
            <FAQItem
              question="What currencies do you support?"
              answer="Prices are stored and displayed in LKR by default. Couples can switch to USD, GBP, AUD, or EUR for display."
            />
            <FAQItem
              question="Is my data safe?"
              answer="We do not sell personal data. WhatsApp conversations happen directly between couples and vendors — we do not have access to them."
            />
            <FAQItem
              question="Which languages are supported?"
              answer="English and Sinhala. Tamil support is on the roadmap."
            />
          </div>
        </section>
      </Reveal>
    </div>
  );
}
