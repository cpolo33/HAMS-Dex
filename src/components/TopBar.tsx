import {
  PlusCircleOutlined,
} from '@ant-design/icons';
import { Col, Menu, Row } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { ENDPOINTS, useConnectionConfig } from '../utils/connection';
import CustomClusterEndpointDialog from './CustomClusterEndpointDialog';
import { EndpointInfo } from '../utils/types';
import { notify } from '../utils/notifications';
import { Connection } from '@solana/web3.js';
import WalletConnect from './WalletConnect';
import AppSearch from './AppSearch';
import { getTradePageUrl } from '../utils/markets';

const Wrapper = styled.div`
  background: linear-gradient(100.61deg, #090B0B 0%, #1C2222 100%);
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  padding: 0px 30px;
  flex-wrap: wrap;
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

const EXTERNAL_LINKS = {
  '/learn': 'https://serum-academy.com/en/serum-dex/',
  '/add-market': 'https://serum-academy.com/en/add-market/',
  '/wallet-support': 'https://serum-academy.com/en/wallet-support',
  '/dex-list': 'https://serum-academy.com/en/dex-list/',
  '/developer-resources': 'https://serum-academy.com/en/developer-resources/',
  '/explorer': 'https://explorer.solana.com',
  '/srm-faq': 'https://projectserum.com/srm-faq',
  'https://hams.holaplex.com/#/': 'https://hams.holaplex.com/#/',
  'https://digitaleyes.market/collections/Space%20Hamster': 'https://digitaleyes.market/collections/Space%20Hamster',
  'https://app.step.finance/#/dashboard': 'https://app.step.finance/#/dashboard',
};

export default function TopBar() {
  const {
    endpoint,
    endpointInfo,
    setEndpoint,
    availableEndpoints,
    setCustomEndpoints,
  } = useConnectionConfig();
  const [addEndpointVisible, setAddEndpointVisible] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const location = useLocation();
  const history = useHistory();

  const handleClick = useCallback(
    (e) => {
      if (!(e.key in EXTERNAL_LINKS)) {
        history.push(e.key);
      }
    },
    [history],
  );

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

  return (
    <>
      <CustomClusterEndpointDialog
        visible={addEndpointVisible}
        testingConnection={testingConnection}
        onAddCustomEndpoint={onAddCustomEndpoint}
        onClose={() => setAddEndpointVisible(false)}
      />
      <Wrapper>
        <div style={{ display: 'contents' }}>
          <LogoWrapper onClick={() => history.push(tradePageUrl)}>
            <img src={'https://i.ibb.co/K79sfcc/logo.png'} alt="" />
            {'HAMS'}
          </LogoWrapper>
          <Menu
            mode="horizontal"
            onClick={handleClick}
            selectedKeys={[location.pathname]}
            style={{
              borderBottom: 'none',
              backgroundColor: 'transparent',
              alignItems: 'flex-end',
              flex: 1,
            }}
          >
            <Menu.Item key={tradePageUrl} style={{ margin: '0 0 0 20px' }}>
              TRADE
            </Menu.Item>
            <Menu.Item key="5j6hdwx4eW3QBYZtRjKiUj7aDA1dxDpveSHBznwq7kUv" style={{ margin: '0 0 0 20px', color: '#2abdd2', fontWeight: 'normal' }}>
              <a href={EXTERNAL_LINKS['5j6hdwx4eW3QBYZtRjKiUj7aDA1dxDpveSHBznwq7kUv']}>Buy HAMS</a>
            </Menu.Item>
            <Menu.SubMenu title="NFT" style={{ margin: '0 0 0 20px', color: '#ffffff', fontWeight: 'normal' }}>
              <Menu.Item key="https://hams.holaplex.com/#/">
                <a href="https://hams.holaplex.com/#/" target="_blank" rel="noopener noreferrer">Holaplex</a>
              </Menu.Item>
              <Menu.Item key="https://digitaleyes.market/collections/Space%20Hamster">
                <a href="https://digitaleyes.market/collections/Space%20Hamster" target="_blank" rel="noopener noreferrer">DigitalEyes</a>
              </Menu.Item>
            </Menu.SubMenu>
            <Menu.Item key="https://app.step.finance/#/dashboard" style={{ margin: '0 0 0 20px', color: '#2abdd2', fontWeight: 'normal' }}>
              <a href="https://app.step.finance/#/dashboard" target="_blank" rel="noopener noreferrer">DASHBOARD</a>
            </Menu.Item>
            {/* <Menu.Item key={'/swap'} style={{ margin: '0 0 0 20px', color: '#2abdd2', fontWeight: 'normal' }}>
                SWAP
              </Menu.Item>
            */}
          </Menu>
          <div>
            <Row
              align="middle"
              style={{ paddingLeft: 12, paddingRight: 5 }}
              gutter={16}
            >
              <Col>
                <PlusCircleOutlined
                  style={{ color: '#2abdd2' }}
                  onClick={() => setAddEndpointVisible(true)}
                />
              </Col>
              {/*
              <Col>
                <Popover
                  content={endpoint}
                  placement="bottomRight"
                  title="URL"
                  trigger="hover"
                >
                  <InfoCircleOutlined style={{ color: '#2abdd2' }} />
                </Popover>
              </Col>
              <Col>
                <Select
                  onSelect={setEndpoint}
                  value={endpoint}
                  style={{ marginRight: 8, width: '150px' }}
                >
                  {availableEndpoints.map(({ name, endpoint }) => (
                    <Select.Option value={endpoint} key={endpoint}>
                      {name}
                    </Select.Option>
                  ))}
                </Select>
              </Col>
              */}
            </Row>
          </div>
        </div>
        <div>
          <WalletConnect />
        </div>
      </Wrapper>
    </>
  );
}