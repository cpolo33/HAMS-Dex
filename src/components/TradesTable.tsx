import { Col, Row, Divider } from 'antd';
import React from 'react';
import styled from 'styled-components';
import { useMarket, useBonfidaTrades } from '../utils/markets';
import { getDecimalCount } from '../utils/utils';
import FloatingElement from './layout/FloatingElement';
import { BonfidaTrade } from '../utils/types';

const Title = styled.div`
  color: rgba(255, 255, 255, 1);
`;
const SizeTitle = styled(Row)`
  padding: 20px 0 14px;
  color: #ffffff;
`;

export default function PublicTrades({ smallScreen }) {
  const { baseCurrency, quoteCurrency, market } = useMarket();
  const [trades, loaded] = useBonfidaTrades();

  return (
    <FloatingElement
      style={
        {
          ...(smallScreen
            ? { flex: 1, overflow: 'hidden' }
            : {
              // marginTop: '10px',
              minHeight: '400px',
              maxHeight: 'calc(100vh - 700px)',
              flex: 1,
              overflow: 'hidden'
            }),
        }
      }
    >
      <Divider>
        <Title>Recent Trades</Title>
      </Divider>
      <SizeTitle>
        <Col span={8}>Price ({quoteCurrency}) </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          Size ({baseCurrency})
        </Col>
        <Col span={8} style={{ textAlign: 'right' }}>
          Time
        </Col>
      </SizeTitle>
      {!!trades && loaded && (
        <div
          style={{
            marginRight: '-10px',
            paddingRight: '5px',
            overflowY: 'scroll',
            // maxHeight: smallScreen
            //   ? 'calc(100% - 75px)'
            //   : 'calc(100vh - 800px)',
            height: 350
          }}
        >
          {trades.map((trade: BonfidaTrade, i: number) => (
            <Row key={i} style={{ marginBottom: 4 }}>
              <Col
                span={8}
                style={{
                  color: trade.side === 'buy' ? '#0AD171' : '#FD499D',
                }}
              >
                {market?.tickSize && !isNaN(trade.price)
                  ? Number(trade.price).toFixed(
                    getDecimalCount(market.tickSize),
                  )
                  : trade.price}
              </Col>
              <Col span={8} style={{ textAlign: 'right' }}>
                {market?.minOrderSize && !isNaN(trade.size)
                  ? Number(trade.size).toFixed(
                    getDecimalCount(market.minOrderSize),
                  )
                  : trade.size}
              </Col>
              <Col span={8} style={{ textAlign: 'right', color: '#676767' }}>
                {trade.time && new Date(trade.time).toLocaleTimeString()}
              </Col>
            </Row>
          ))}
        </div>
      )}
    </FloatingElement>
  );
}