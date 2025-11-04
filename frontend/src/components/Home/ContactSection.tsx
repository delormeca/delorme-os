import { styled, Container, Typography, Button, Link } from "@mui/material";

const ContactSectionWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(8, 0),
  textAlign: "center",
}));

const ContactSection = () => (
  <ContactSectionWrapper>
    <Container maxWidth="lg">
      <Typography align="center" variant="h2" gutterBottom>
        Contact Us
      </Typography>
      <Typography variant="body1" paragraph color="text.secondary">
        Have questions or need support? Reach out to us and we'll be happy
        to help!
      </Typography>
      <Button variant="contained" color="primary" size="large" sx={{ mt: 2 }} component={Link} href="mailto:info@YOUR_DOMAIN.com">
        Get in Touch
      </Button>
    </Container>
  </ContactSectionWrapper>
);

export default ContactSection;
