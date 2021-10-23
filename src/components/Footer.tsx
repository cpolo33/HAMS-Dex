import React from 'react';
import { Layout, Row, Col } from 'antd';
import Link from './Link';
import { helpUrls } from './HelpUrls';
const { Footer } = Layout;

const footerElements = [
  { description: 'Website', link: helpUrls.website },
  { description: 'Project Info', link: helpUrls.projectInfo },
  { description: 'Telegram', link: helpUrls.telegram },
  { description: 'Twitter', link: helpUrls.twitter },
  { description: 'NFT', link: helpUrls.nft },
  { description: 'List your token', link: helpUrls.listYourToken },
];

export const CustomFooter = () => {
  return (
    <Footer
    style={{
      minHeight: '15px',
      paddingBottom: 5,
      paddingTop: 5,
      background: '#090b0b',
      alignItems: 'center',
    }} >
      <Row
        gutter={[16, 20]}
        style={{
          alignItems: 'center',
          placeContent: 'center',
      }}
    >
        <Col
          style={{
            alignItems: 'center',
            placeContent: 'center',
            textAlign: 'center'
          }}
          flex="auto" >
          {"© Space Hamster All rights reserved 2021"}
        </Col>
        <Col
          style={{
            alignItems: 'center',
            placeContent: 'center',
            textAlign: 'center'
          }}
          flex="auto" >
          <Row 
            style={{
              alignItems: 'center',
              placeContent: 'center',
              textAlign: 'center'
            }}
          >
          {footerElements.map((elem, index) => {
            return (
              <Col key={index + ''} style={{paddingLeft: '20px', paddingRight: '20px'}} >
                <Link external to={elem.link}>
                {elem.description}
                </Link>
              </Col>
            );
          })}
          </Row>
        </Col>
      </Row>
    </Footer>
  );
};