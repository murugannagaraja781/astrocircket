import React from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import TempleHinduIcon from '@mui/icons-material/TempleHindu';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CelebrationIcon from '@mui/icons-material/Celebration';

// South Indian inspired colors
const southIndianColors = {
  primary: '#FF6B6B', // Vibrant saffron
  secondary: '#4ECDC4', // Turquoise
  accent: '#FFD166', // Gold/Yellow
  dark: '#1A535C', // Deep teal
  light: '#F7FFF7' // Off-white
};

// Styled components with South Indian aesthetic
const CulturalCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8],
  },
  borderTop: `4px solid ${southIndianColors.primary}`,
  backgroundColor: '#ffffff',
  textAlign: 'center',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  position: 'relative',
  display: 'inline-block',
  marginBottom: theme.spacing(4),
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60%',
    height: 4,
    backgroundColor: southIndianColors.accent,
    borderRadius: 2,
  },
}));

const SouthIndianHero = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${southIndianColors.dark}, ${southIndianColors.primary})`,
  borderRadius: 24,
  padding: theme.spacing(6),
  marginBottom: theme.spacing(6),
  color: 'white',
  textAlign: 'center',
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(4),
  },
}));

const CulturalItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(3),
  height: '100%',
  backgroundColor: '#fff',
  borderRadius: 12,
  border: `2px solid ${southIndianColors.secondary}20`,
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: southIndianColors.dark,
  borderRadius: '0 0 16px 16px',
}));

const ResponsiveSouthIndianLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Cultural items data
  const culturalItems = [
    {
      icon: <TempleHinduIcon sx={{ fontSize: 40, color: southIndianColors.primary }} />,
      title: "Temple Architecture",
      description: "Intricate Dravidian style temples",
      color: southIndianColors.primary
    },
    {
      icon: <RestaurantIcon sx={{ fontSize: 40, color: southIndianColors.secondary }} />,
      title: "Cuisine",
      description: "Authentic South Indian dishes",
      color: southIndianColors.secondary
    },
    {
      icon: <MusicNoteIcon sx={{ fontSize: 40, color: southIndianColors.accent }} />,
      title: "Classical Music",
      description: "Carnatic music traditions",
      color: southIndianColors.accent
    },
    {
      icon: <CelebrationIcon sx={{ fontSize: 40, color: southIndianColors.primary }} />,
      title: "Festivals",
      description: "Colorful cultural celebrations",
      color: southIndianColors.primary
    }
  ];

  // Features data
  const features = [
    {
      title: "Rich Heritage",
      description: "Ancient traditions preserved for generations",
      image: "https://images.unsplash.com/photo-1587135941948-670b381f08ce?w=400"
    },
    {
      title: "Art & Craft",
      description: "Exquisite handloom and artwork",
      image: "https://images.unsplash.com/photo-1563089145-599997674d42?w-400"
    },
    {
      title: "Dance Forms",
      description: "Classical Bharatanatyam and more",
      image: "https://images.unsplash.com/photo-1547153760-18fc86324498?w=400"
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: southIndianColors.light,
      backgroundImage: 'radial-gradient(#4ECDC4 1px, transparent 1px)',
      backgroundSize: '40px 40px'
    }}>
      {/* Header */}
      <StyledAppBar position="static">
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                color: southIndianColors.accent
              }}
            >
              தென்னிந்தியா
            </Typography>
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button color="inherit">Home</Button>
                <Button color="inherit">Culture</Button>
                <Button color="inherit">Temples</Button>
                <Button color="inherit">Cuisine</Button>
                <Button color="inherit">Arts</Button>
              </Box>
            )}
            {isMobile && (
              <IconButton color="inherit">
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </StyledAppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Hero Section */}
        <SouthIndianHero>
          <Typography
            variant={isMobile ? "h4" : "h2"}
            sx={{
              fontWeight: 'bold',
              mb: 2,
              color: southIndianColors.accent
            }}
          >
            South Indian Heritage
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            A rich tapestry of culture, tradition, and spirituality
          </Typography>
          <Button
            variant="contained"
            sx={{
              backgroundColor: southIndianColors.accent,
              color: southIndianColors.dark,
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#FFC145'
              }
            }}
          >
            Explore Culture
          </Button>
        </SouthIndianHero>

        {/* Cultural Highlights Section */}
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <SectionTitle variant="h3" sx={{ color: southIndianColors.dark }}>
            Cultural Highlights
          </SectionTitle>

          <Grid container spacing={3} justifyContent="center">
            {culturalItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <CulturalCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {item.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        color: item.color
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                  </CardContent>
                </CulturalCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Features Section */}
        <Box sx={{ mb: 8 }}>
          <SectionTitle variant="h3" sx={{ textAlign: 'center', color: southIndianColors.dark }}>
            Traditional Arts
          </SectionTitle>

          <Grid container spacing={4} alignItems="center">
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <CulturalCard>
                  <CardMedia
                    component="img"
                    height="200"
                    image={feature.image}
                    alt={feature.title}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        color: southIndianColors.primary
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </CulturalCard>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Centered Data Section */}
        <Box sx={{
          backgroundColor: '#fff',
          borderRadius: 4,
          p: 4,
          textAlign: 'center',
          border: `2px solid ${southIndianColors.secondary}30`
        }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              mb: 3,
              color: southIndianColors.dark
            }}
          >
            Cultural Statistics
          </Typography>

          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={6} sm={3}>
              <CulturalItem>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: southIndianColors.primary }}>
                  5000+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Ancient Temples
                </Typography>
              </CulturalItem>
            </Grid>
            <Grid item xs={6} sm={3}>
              <CulturalItem>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: southIndianColors.secondary }}>
                  2000+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Dance Forms
                </Typography>
              </CulturalItem>
            </Grid>
            <Grid item xs={6} sm={3}>
              <CulturalItem>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: southIndianColors.accent }}>
                  100+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Festivals
                </Typography>
              </CulturalItem>
            </Grid>
            <Grid item xs={6} sm={3}>
              <CulturalItem>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: southIndianColors.primary }}>
                  500+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Art Forms
                </Typography>
              </CulturalItem>
            </Grid>
          </Grid>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            mt: 6,
            pt: 4,
            textAlign: 'center',
            borderTop: `2px solid ${southIndianColors.accent}40`
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2024 South Indian Cultural Heritage. All rights reserved.
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
            Preserving the rich traditions of Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, and Telangana
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ResponsiveSouthIndianLayout;
