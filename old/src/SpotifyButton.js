import React from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/system';

// Custom styles for the button
const CustomButtonContainer = styled('div')({
  width: '100%',
  height: '100%',
});

const InnerCircle = styled('div')({
  width: 324,
  height: 324,
  left: 7,
  top: 10,
  position: 'absolute',
  background: '#FFD240',
  borderRadius: 9999,
  border: '9px #E6A7D4 solid',
});

const ButtonText = styled('div')({
  width: 336,
  height: 340,
  left: 0,
  top: 0,
  position: 'absolute',
  textAlign: 'center',
  color: '#53498E',
  fontSize: 40,
  fontFamily: 'Gunnar',
  fontWeight: 700,
  textTransform: 'uppercase',
  wordWrap: 'break-word',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column',
});

const SpotifyButton = ({ onClick }) => (
  <Button
    onClick={onClick}
    style={{
      padding: 0,
      minWidth: 400,
      minHeight: 400,
      position: 'relative',
      backgroundColor: 'transparent',
      marginLeft: '50px', // Move the button to the right
      marginTop: '-50px', // Move the button up
    }}
  >
    <CustomButtonContainer>
      <InnerCircle />
      <ButtonText>
        Connect <br /> to <br /> Spotify
      </ButtonText>
    </CustomButtonContainer>
  </Button>
);

export default SpotifyButton;
