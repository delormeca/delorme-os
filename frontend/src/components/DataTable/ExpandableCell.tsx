import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Collapse,
  Paper,
  Link,
  Chip,
  Stack,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface ExpandableCellProps {
  preview: string | React.ReactNode;
  fullContent: React.ReactNode;
  defaultExpanded?: boolean;
}

export const ExpandableCell: React.FC<ExpandableCellProps> = ({
  preview,
  fullContent,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2">{preview}</Typography>
        <IconButton
          size="small"
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ ml: 'auto' }}
        >
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={isExpanded}>
        <Paper
          variant="outlined"
          sx={{
            mt: 1,
            p: 2,
            maxHeight: 400,
            overflow: 'auto',
            bgcolor: 'grey.50',
          }}
        >
          {fullContent}
        </Paper>
      </Collapse>
    </Box>
  );
};

// Webpage Structure Cell
interface WebpageStructureCellProps {
  structure: any;
}

export const WebpageStructureCell: React.FC<WebpageStructureCellProps> = ({
  structure,
}) => {
  if (!structure) return <Typography variant="body2">N/A</Typography>;

  const structureStr = JSON.stringify(structure);
  const preview = structureStr.substring(0, 50) + '...';

  const renderStructure = (data: any) => {
    if (Array.isArray(data)) {
      return (
        <Stack spacing={0.5}>
          {data.map((item: any, idx: number) => (
            <Box
              key={idx}
              sx={{
                pl: (item.level || 1) * 2,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
              }}
            >
              <strong>&lt;H{item.level || 1}&gt;</strong> {item.text || item.heading || 'Untitled'}
            </Box>
          ))}
        </Stack>
      );
    }
    return <pre style={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>;
  };

  const fullContent = <Box>{renderStructure(structure)}</Box>;

  return <ExpandableCell preview={preview} fullContent={fullContent} />;
};

// Internal Links Cell
interface LinksCellProps {
  links: any;
  linkType: 'internal' | 'external';
}

export const LinksCell: React.FC<LinksCellProps> = ({ links, linkType }) => {
  if (!links) return <Typography variant="body2">N/A</Typography>;

  const linksArray = Array.isArray(links) ? links : links.links || [];
  const preview = `${linksArray.length} ${linkType} link${linksArray.length !== 1 ? 's' : ''}`;

  const fullContent = (
    <Stack spacing={1.5}>
      {linksArray.map((link: any, idx: number) => (
        <Box key={idx} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {link.anchor_text || link.text || '(no anchor text)'}
          </Typography>
          <Link
            href={link.url || link.href}
            target="_blank"
            rel="noopener noreferrer"
            variant="caption"
            sx={{ wordBreak: 'break-all' }}
          >
            {link.url || link.href}
          </Link>
        </Box>
      ))}
    </Stack>
  );

  return <ExpandableCell preview={preview} fullContent={fullContent} />;
};

// Salient Entities Cell
interface SalientEntitiesCellProps {
  entities: any;
}

export const SalientEntitiesCell: React.FC<SalientEntitiesCellProps> = ({
  entities,
}) => {
  if (!entities) return <Typography variant="body2">N/A</Typography>;

  const entitiesArray = Array.isArray(entities) ? entities : entities.entities || [];
  const preview = `${entitiesArray.length} entit${entitiesArray.length !== 1 ? 'ies' : 'y'} detected`;

  const fullContent = (
    <Stack spacing={1.5}>
      {entitiesArray.map((entity: any, idx: number) => (
        <Box key={idx} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {entity.name || entity.text}
            </Typography>
            <Chip label={entity.type || 'UNKNOWN'} size="small" variant="outlined" />
          </Box>
          {entity.salience !== undefined && (
            <Typography variant="caption" color="text.secondary">
              Salience: {(entity.salience * 100).toFixed(1)}%
            </Typography>
          )}
          {entity.wikipedia_url && (
            <Box sx={{ mt: 0.5 }}>
              <Link
                href={entity.wikipedia_url}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
              >
                Wikipedia →
              </Link>
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );

  return <ExpandableCell preview={preview} fullContent={fullContent} />;
};

// Body Content Cell
interface BodyContentCellProps {
  content: string | null | undefined;
}

export const BodyContentCell: React.FC<BodyContentCellProps> = ({ content }) => {
  if (!content) return <Typography variant="body2">N/A</Typography>;

  const preview = content.substring(0, 100) + '...';

  const fullContent = (
    <Typography
      variant="body2"
      component="div"
      sx={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {content}
    </Typography>
  );

  return <ExpandableCell preview={preview} fullContent={fullContent} />;
};

// Schema Markup Cell
interface SchemaCellProps {
  schema: any;
}

export const SchemaCell: React.FC<SchemaCellProps> = ({ schema }) => {
  if (!schema) return <Typography variant="body2">No schema</Typography>;

  const preview = 'Schema present';

  const fullContent = (
    <pre
      style={{
        fontSize: '0.75rem',
        overflow: 'auto',
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {JSON.stringify(schema, null, 2)}
    </pre>
  );

  return <ExpandableCell preview={preview} fullContent={fullContent} />;
};
