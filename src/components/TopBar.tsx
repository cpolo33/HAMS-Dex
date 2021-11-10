import {
  WalletOutlined,
} from '@ant-design/icons';
import { Col, Menu, Row, Button } from 'antd';
import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { ENDPOINTS, useConnectionConfig } from '../utils/connection';
import CustomClusterEndpointDialog from './CustomClusterEndpointDialog';
import { EndpointInfo } from '../utils/types';
import { notify } from '../utils/notifications';
import { Connection } from '@solana/web3.js';
import WalletConnect from './WalletConnect';
import { getTradePageUrl } from '../utils/markets';
import MyTokenDialog from './MyTokenDialog';
import { useWallet } from '../utils/wallet';

const Wrapper = styled.div`
  // flex-direction: row;
  // justify-content: flex-end;
  // flex-wrap: wrap;
  background: linear-gradient(100.61deg, #090B0B 0%, #1C2222 100%);
`;

const ActionButton = styled(Button)`
  color: #ffffff;
  border-radius: 8px;
`;
const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  color: #ffffff;
  font-weight: bold;
  cursor: pointer;
  img {
    height: 40px;
    margin-right: 5px;
  }
`;

const MENU = [
  {
    'title': 'TRADE',
    'link': '/',
  },
  {
    'title': 'Buy HAMS',
    'link': 'https://dex.solhamster.space/#/market/5j6hdwx4eW3QBYZtRjKiUj7aDA1dxDpveSHBznwq7kUv',
  },
  {
    'title': 'NFTs',
    'child': [
      {
        'title': 'Holaplex',
        'link': 'https://hams.holaplex.com/#/'
      },
      {
        'title': 'DigitalEyes',
        'link': 'https://digitaleyes.market/collections/Space%20Hamster'
      },
    ]
  },
  {
    'title': 'DASHBOARD',
    'link': 'https://app.step.finance/#/dashboard',
  },
]

export default function TopBar() {
  const { connected } = useWallet();
  const {
    endpointInfo,
    setEndpoint,
    availableEndpoints,
    setCustomEndpoints,
  } = useConnectionConfig();
  const [addEndpointVisible, setAddEndpointVisible] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [addMyTokenVisible, setAddMyTokenVisible] = useState(false);
  const location = useLocation();
  const history = useHistory();

  const onAddCustomEndpoint = (info: EndpointInfo) => {
    const existingEndpoint = availableEndpoints.some(
      (e) => e.endpoint === info.endpoint,
    );
    if (existingEndpoint) {
      notify({
        message: `An endpoint with the given url already exists`,
        type: 'error',
      });
      return;
    }

    const handleError = (e) => {
      console.log(`Connection to ${info.endpoint} failed: ${e}`);
      notify({
        message: `Failed to connect to ${info.endpoint}`,
        type: 'error',
      });
    };

    try {
      const connection = new Connection(info.endpoint, 'recent');
      connection
        .getEpochInfo()
        .then((result) => {
          setTestingConnection(true);
          console.log(`testing connection to ${info.endpoint}`);
          const newCustomEndpoints = [
            ...availableEndpoints.filter((e) => e.custom),
            info,
          ];
          setEndpoint(info.endpoint);
          setCustomEndpoints(newCustomEndpoints);
        })
        .catch(handleError);
    } catch (e) {
      handleError(e);
    } finally {
      setTestingConnection(false);
    }
  };

  const endpointInfoCustom = endpointInfo && endpointInfo.custom;
  useEffect(() => {
    const handler = () => {
      if (endpointInfoCustom) {
        setEndpoint(ENDPOINTS[0].endpoint);
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [endpointInfoCustom, setEndpoint]);

  const tradePageUrl = location.pathname.startsWith('/market/')
    ? location.pathname
    : getTradePageUrl();
  const { SubMenu } = Menu;

  return (
    <>
      <CustomClusterEndpointDialog
        visible={addEndpointVisible}
        testingConnection={testingConnection}
        onAddCustomEndpoint={onAddCustomEndpoint}
        onClose={() => setAddEndpointVisible(false)}
      />
      <MyTokenDialog
        visible={addMyTokenVisible}
        onClose={() => setAddMyTokenVisible(false)}
      />
      <Wrapper>
        <Row wrap={false} style={{ height: 50 }}>
          <Col flex="none">
            <LogoWrapper onClick={() => history.push(tradePageUrl)} style={{ paddingLeft: 30 }}>
              <img src={'https://i.ibb.co/K79sfcc/logo.png'} alt="" />
              <Col style={{ paddingLeft: 5, fontSize: '20px' }}>
                {'HAMS'}
              </Col>
            </LogoWrapper>
          </Col>
          <Col flex="auto" style={{ textAlign: 'center' }}>
            <Menu mode="horizontal"
              style={{
                backgroundColor: 'transparent',
                borderBottom: 'none',
                fontSize: '16px',
                display: 'flex',
                justifyContent: 'center'
              }}>
              {MENU.map(item => {
                if (item.child === undefined) {
                  return <Menu.Item key={item.title}><a href={item.link} target={item.link.startsWith('/') ? '_self' : '_blank'} rel="noopener noreferrer">{item.title}</a></Menu.Item>
                } else {
                  return <SubMenu key={item.title} title={item.title}>
                    {item.child.map(itemChild => <Menu.Item key={itemChild.title}><a href={itemChild.link} target={itemChild.link.startsWith('/') ? '_self' : '_blank'} rel="noopener noreferrer">{itemChild.title}</a></Menu.Item>)}
                  </SubMenu>
                }
              }
              )}
            </Menu>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right', display: 'contents' }}>
            {connected && (
              <Col flex="none" style={{ marginTop: '1px', display: 'block' }}>
                <ActionButton
                  style={{ border: '2px solid #2abdd2' }}
                    size="large"
                    icon={<WalletOutlined />}
                    onClick={() => setAddMyTokenVisible(true)}>
                    My token
                    </ActionButton>
              </Col>
            )}
          </Col>
          <Col flex="none" style={{ paddingRight: 20 }}>
            <WalletConnect />
          </Col>
        </Row>
      </Wrapper>
    </>
  );
}