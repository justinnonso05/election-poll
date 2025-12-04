'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, HelpCircle, ChevronDown, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface FrequentlyAskedProps {
  electionId: string;
  candidates: Array<{ id: string; name: string; position: string }>;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sources: Array<{
    candidateId: string;
    candidateName: string;
    position: string;
    content: string;
    similarity: number;
  }>;
  createdAt: string;
}

export function FrequentlyAsked({ electionId }: FrequentlyAskedProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Fetch existing FAQs on component mount
  useEffect(() => {
    fetchFAQs();
  }, [electionId]);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/faq?electionId=${electionId}`);
      const result = await response.json();

      if (response.ok && result.status === 'success') {
        setFaqs(result.data.faqs || []);
      } else {
        console.error('Failed to fetch FAQs:', result.message);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateFAQs = async () => {
    setRegenerating(true);
    try {
      const response = await fetch('/api/ai/regenerate-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId }),
      });

      const result = await response.json();

      if (response.ok && result.status === 'success') {
        toast.success('FAQ regenerated successfully!');
        await fetchFAQs(); // Refresh the FAQs
      } else {
        toast.error(result.message || 'Failed to regenerate FAQ');
      }
    } catch (error) {
      console.error('Error regenerating FAQ:', error);
      toast.error('Failed to regenerate FAQ');
    } finally {
      setRegenerating(false);
    }
  };

  const toggleExpanded = (faqId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(faqId)) {
      newExpanded.delete(faqId);
    } else {
      newExpanded.add(faqId);
    }
    setExpandedItems(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2 text-sm sm:text-base">Loading FAQ...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-4 lg:space-y-6">
      <Card>
        {/* Reduced header padding on mobile */}
        <CardHeader className="pb-2 sm:pb-3 lg:pb-4 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="truncate">Frequently Asked Questions</span>
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {faqs.length > 0 
                  ? `${faqs.length} pre-generated answers from candidate manifestos`
                  : 'No FAQ available for this election'
                }
              </p>
            </div>
            
            {/* Only show regenerate button for admins */}
            {faqs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateFAQs}
                disabled={regenerating}
                className="flex items-center gap-1 sm:gap-2 text-xs px-2 sm:px-3 py-1 sm:py-2 self-start sm:self-auto"
              >
                {regenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span className="hidden xs:inline text-xs">
                  {regenerating ? 'Regenerating...' : 'Regenerate'}
                </span>
                <span className="xs:hidden text-xs">
                  {regenerating ? 'Updating...' : 'Update'}
                </span>
              </Button>
            )}
          </div>
        </CardHeader>

        {/* Reduced content padding on mobile */}
        <CardContent className="pt-0 px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6">
          {faqs.length === 0 ? (
            <div className="text-center py-4 sm:py-6 lg:py-8">
              <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-sm sm:text-base lg:text-lg font-medium mb-2">No FAQ Available</h3>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mb-3 sm:mb-4">
                FAQ for this election hasn't been generated yet.
              </p>
              <div className="bg-muted/50 rounded-lg p-2 sm:p-3 lg:p-4 text-xs sm:text-sm text-muted-foreground">
                <p className="font-medium mb-2">FAQ will be available once generated by administrators.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1 sm:space-y-2 lg:space-y-3">
              {faqs.map((faq) => {
                const isExpanded = expandedItems.has(faq.id);
                return (
                  <Card key={faq.id} className="border-l-2 sm:border-l-4 border-l-primary/20">
                    <CardContent className="p-0">
                      {/* Clickable question area with minimal padding on mobile */}
                      <div
                        className="w-full cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExpanded(faq.id)}
                      >
                        <div className="flex items-start gap-1 sm:gap-2 lg:gap-3 p-2 sm:p-3 lg:p-4">
                          {/* Question text - now properly wrappable with more space */}
                          <div className="flex-1 min-w-0 pr-1">
                            <p className="text-xs sm:text-sm font-medium leading-relaxed text-foreground break-words hyphens-auto">
                              {faq.question}
                            </p>
                          </div>
                          
                          {/* Chevron icon - compact on mobile */}
                          <div className="flex-shrink-0 mt-0.5">
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded content with minimal padding on mobile */}
                      {isExpanded && (
                        <div className="px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3 lg:pb-4 space-y-2 sm:space-y-3 border-t border-border/50">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
                              {faq.answer}
                            </div>
                          </div>
                          
                          {faq.sources && faq.sources.length > 0 && (
                            <div className="flex flex-wrap items-start gap-1 pt-1 sm:pt-2 border-t border-border/30">
                              <span className="text-xs text-muted-foreground mr-1 sm:mr-2 flex-shrink-0 mt-0.5">Based on:</span>
                              <div className="flex flex-wrap gap-1">
                                {faq.sources.map((source, index) => (
                                  <Badge key={index} variant="outline" className="text-xs px-1 sm:px-2 py-0.5">
                                    {source.candidateName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}