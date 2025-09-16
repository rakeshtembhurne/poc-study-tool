'use client';

import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileCardData } from '@/types/card';

interface FilePreviewProps {
  fileCardData: FileCardData[];
}

export default function FilePreview({ fileCardData }: FilePreviewProps) {
  const formatFileSize = (bytes: number): string => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  if (!fileCardData || fileCardData.length === 0) return null;

  const totalCards = fileCardData.reduce(
    (sum, data) => sum + data.cards.length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">File Preview</h3>
        <p className="text-sm text-muted-foreground">
          {totalCards} total cards from {fileCardData.length} file
          {fileCardData.length > 1 ? 's' : ''}
        </p>
      </div>

      {fileCardData.map((data, fileIndex) => (
        <Card key={fileIndex}>
          <CardContent className="p-6 space-y-4">
            {/* File Details */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-medium text-foreground">
                    {data.file.name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(data.file.size)}
                    </span>
                    <Badge variant="secondary">{data.cards.length} cards</Badge>
                  </div>
                </div>
              </div>
              {data.error && (
                <Badge variant="destructive" className="text-xs">
                  Error
                </Badge>
              )}
            </div>

            {data.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                {data.error}
              </div>
            )}

            {/* Preview Cards */}
            {data.cards.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-foreground">
                  Card Preview
                </h5>
                <div className="max-h-60 overflow-y-auto space-y-3">
                  {data.cards.slice(0, 3).map((card, cardIndex) => (
                    <div key={cardIndex}>
                      <div className="p-4 bg-background border rounded-lg space-y-3">
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              Q: {card.question}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              A: {card.answer}
                            </p>
                          </div>
                          <Badge
                            variant={
                              card.difficulty.toLowerCase() === 'easy'
                                ? 'secondary'
                                : card.difficulty.toLowerCase() === 'hard'
                                  ? 'destructive'
                                  : 'default'
                            }
                            className="shrink-0"
                          >
                            {card.difficulty}
                          </Badge>
                        </div>
                      </div>
                      {cardIndex < Math.min(data.cards.length - 1, 2) && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))}
                  {data.cards.length > 3 && (
                    <>
                      <Separator />
                      <div className="text-center text-sm text-muted-foreground py-2">
                        ... and {data.cards.length - 3} more cards from this
                        file
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
