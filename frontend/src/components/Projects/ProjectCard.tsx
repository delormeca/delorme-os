import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  useTheme,
} from "@mui/material";
import { CalendarToday, Language, Folder, Edit } from "@mui/icons-material";
import { ProjectRead } from "@/client";
import { StandardButton } from "@/components/ui";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  project: ProjectRead;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const formatDateShort = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const truncateUrl = (url: string, maxLength: number = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: theme.shadows[4],
        },
      }}
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ mb: 2 }}>
          <Folder sx={{ fontSize: 40, color: theme.palette.primary.main }} />
        </Box>

        <Typography
          variant="h6"
          component="h3"
          sx={{
            fontWeight: 600,
            mb: 1,
            lineHeight: 1.3,
          }}
        >
          {project.name}
        </Typography>

        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Language sx={{ fontSize: "1rem", color: "text.secondary" }} />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {truncateUrl(project.url)}
          </Typography>
        </Box>

        {project.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {project.description}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "text.secondary",
          }}
        >
          <CalendarToday sx={{ fontSize: "1rem" }} />
          <Typography variant="caption">
            Created {formatDateShort(project.created_at)}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <StandardButton
          size="small"
          variant="outlined"
          startIcon={<Edit />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/projects/${project.id}`);
          }}
          sx={{ flex: 1 }}
        >
          View Details
        </StandardButton>
      </CardActions>
    </Card>
  );
};

export default ProjectCard;
