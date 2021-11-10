import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Button, Col, Popover, Row, Select, Typography } from 'antd';
import styled from 'styled-components';
import moment from 'moment';
import Orderbook from '../components/Orderbook';
import UserInfoTable from '../components/UserInfoTable';
import StandaloneBalancesDisplay from '../components/StandaloneBalancesDisplay';
import FloatingElement from '../components/layout/FloatingElement';
import {
  getMarketInfos,
  getTradePageUrl,
  MarketProvider,
  useMarket,
  useMarketsList,
  useUnmigratedDeprecatedMarkets,
  useMarkPrice,
  useBonfidaTrades,
  useVolumes,
} from '../utils/markets';
import TradeForm from '../components/TradeForm';
import TradesTable from '../components/TradesTable';
import LinkAddress from '../components/LinkAddress';
import DeprecatedMarketsInstructions from '../components/DeprecatedMarketsInstructions';
import {
  DeleteOutlined,
  InfoCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import CustomMarketDialog from '../components/CustomMarketDialog';
import { notify } from '../utils/notifications';
import { useHistory, useParams } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { TVChartContainer } from '../components/TradingView';
import { isNullOrUndefined } from '../utils/utils';

const { Option, OptGroup } = Select;

const Wrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 16px;
  .borderNone .ant-select-selector {
    border: none !important;
  }
`;

export default function TradePage() {
  const { marketAddress } = useParams();
  useEffect(() => {
    if (marketAddress) {
      localStorage.setItem('marketAddress', JSON.stringify(marketAddress));
    }
  }, [marketAddress]);
  const history = useHistory();
  function setMarketAddress(address) {
    history.push(getTradePageUrl(address));
  }

  return (
    <MarketProvider
      marketAddress={marketAddress}
      setMarketAddress={setMarketAddress}
    >
      <TradePageInner />
    </MarketProvider>
  );
}

function TradePageInner() {
  const {
    market,
    marketName,
    customMarkets,
    setCustomMarkets,
    setMarketAddress,
    quoteCurrency,
  } = useMarket();
  const markets = useMarketsList();
  const [handleDeprecated, setHandleDeprecated] = useState(false);
  const [addMarketVisible, setAddMarketVisible] = useState(false);
  const deprecatedMarkets = useUnmigratedDeprecatedMarkets();
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });
  const markPrice = useMarkPrice();
  const [trades, tradesLoaded] = useBonfidaTrades();
  const [volumes, volumeLoaded] = useVolumes();

  useEffect(() => {
    document.title = marketName ? `${marketName} — HAMS Dex` : 'Space Hamster';
  }, [marketName]);

  const changeOrderRef = useRef<
    ({ size, price }: { size?: number; price?: number }) => void
  >();

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const width = dimensions?.width;
  const componentProps = {
    onChangeOrderRef: (ref) => (changeOrderRef.current = ref),
    onPrice: useCallback(
      (price) => changeOrderRef.current && changeOrderRef.current({ price }),
      [],
    ),
    onSize: useCallback(
      (size) => changeOrderRef.current && changeOrderRef.current({ size }),
      [],
    ),
  };

  const dayPercentChange = useMemo(() => {
    if (!tradesLoaded || !trades || trades.length === 0 || !markPrice) return;

    const compareTime = moment().subtract(1, 'days').unix();
    let minAbs = Number.MAX_SAFE_INTEGER;
    let minIndex = -1;
    for (const [index, trade] of trades.entries()) {
      const timeDiff = Math.abs(trade.time - compareTime);
      if (minAbs > timeDiff) {
        minAbs = timeDiff;
        minIndex = index;
      }
    }

    const yesterdayValue = trades[minIndex].price;
    const change = Number(markPrice! - yesterdayValue);
    const percentChange = (change * 100) / yesterdayValue;
    return percentChange;
  }, [tradesLoaded, trades, markPrice]);

  const volumeChange = useMemo(() => {
    if (!volumeLoaded || !volumes) return;

    if (Array.isArray(volumes)) return volumes[0].volumeUsd;
    return volumes.summary.totalVolume;
  }, [volumes, volumeLoaded]);

  const component = (() => {
    if (handleDeprecated) {
      return (
        <DeprecatedMarketsPage
          switchToLiveMarkets={() => setHandleDeprecated(false)}
        />
      );
    } else if (width < 1000) {
      return <RenderSmaller {...componentProps} />;
    } else if (width < 1450) {
      return <RenderSmall {...componentProps} />;
    } else {
      return <RenderNormal {...componentProps} />;
    }
  })();

  const onAddCustomMarket = (customMarket) => {
    const marketInfo = getMarketInfos(customMarkets).some(
      (m) => m.address.toBase58() === customMarket.address,
    );
    if (marketInfo) {
      notify({
        message: `A market with the given ID already exists`,
        type: 'error',
      });
      return;
    }
    const newCustomMarkets = [...customMarkets, customMarket];
    setCustomMarkets(newCustomMarkets);
    setMarketAddress(customMarket.address);
  };

  const onDeleteCustomMarket = (address) => {
    const newCustomMarkets = customMarkets.filter((m) => m.address !== address);
    setCustomMarkets(newCustomMarkets);
  };

  const getChangeColor = () => {
    if (isNullOrUndefined(dayPercentChange)) return '#FFF';
    return dayPercentChange! >= 0 ? '#0ee9a7' : '#ff4747';
  };

  const coinPrice = useMemo(() => {
    if (markPrice) {
      return markPrice > 1 ? markPrice.toFixed(3) : markPrice;
    }
  }, [markPrice]);

  const Volume24Hr = useMemo(() => {
    if (volumeChange === 0) return '-';

    return !isNullOrUndefined(volumeChange)
      ? volumeChange!.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })
      : '-';
  }, [volumeChange]);

  return (
    <>
      <CustomMarketDialog
        visible={addMarketVisible}
        onClose={() => setAddMarketVisible(false)}
        onAddCustomMarket={onAddCustomMarket}
      />
      <Wrapper>
        <Row
          align="middle"
          style={{ paddingLeft: 5, paddingRight: 5 }}
          gutter={16}
        >
          <Col>
            <MarketSelector
              markets={markets}
              setHandleDeprecated={setHandleDeprecated}
              placeholder={'Select market'}
              customMarkets={customMarkets}
              onDeleteCustomMarket={onDeleteCustomMarket}
            />
          </Col>
          {market ? (
            <Col>
              <Popover
                content={<LinkAddress address={market.publicKey.toBase58()} />}
                placement="bottomRight"
                title="Market address"
                trigger="click"
              >
                <InfoCircleOutlined style={{ color: '#2abdd2' }} />
              </Popover>
            </Col>
          ) : null}
          <Col>
            <PlusCircleOutlined
              style={{ color: '#2abdd2' }}
              onClick={() => setAddMarketVisible(true)}
            />
          </Col>
          <Col>{<span style={{ fontSize: '22px' }}>${coinPrice}</span>}</Col>
          <Col flex="auto">
            <Row
              align="middle"
              style={{ paddingLeft: 5, paddingRight: 5 }}
              gutter={16}
            >
              <Col>
                <div>
                  <div>
                    <small style={{ color: '#ABABAB' }}>24hr Change</small>
                  </div>
                  <div>
                    <small>
                      <b
                        style={{
                          color: getChangeColor(),
                        }}
                      >
                        {!isNullOrUndefined(dayPercentChange) ? (
                          <span>
                            {dayPercentChange! >= 0 ? '+' : ''}
                            {dayPercentChange!.toFixed(2)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </b>
                    </small>
                  </div>
                </div>
              </Col>

              <Col>
                {
                  <div>
                    <div>
                      <small style={{ color: '#ABABAB' }}>
                        24hr Volume ({quoteCurrency})
                      </small>
                    </div>
                    <div>
                      <small>
                        <b>{Volume24Hr}</b>
                      </small>
                    </div>
                  </div>
                }
              </Col>
            </Row>
          </Col>
          {deprecatedMarkets && deprecatedMarkets.length > 0 && (
            <React.Fragment>
              <Col>
                <Typography>
                  You have unsettled funds on old markets! Please go through
                  them to claim your funds.
                </Typography>
              </Col>
              <Col>
                <Button onClick={() => setHandleDeprecated(!handleDeprecated)}>
                  {handleDeprecated ? 'View new markets' : 'Handle old markets'}
                </Button>
              </Col>
            </React.Fragment>
          )}
        </Row>
        {component}
      </Wrapper>
    </>
  );
}

function MarketSelector({
  markets,
  placeholder,
  setHandleDeprecated,
  customMarkets,
  onDeleteCustomMarket,
}) {
  const { market, setMarketAddress } = useMarket();

  const onSetMarketAddress = (marketAddress) => {
    setHandleDeprecated(false);
    setMarketAddress(marketAddress);
  };

  const extractBase = (a) => a.split('/')[0];
  const extractQuote = (a) => a.split('/')[1];

  const selectedMarket = getMarketInfos(customMarkets)
    .find(
      (proposedMarket) =>
        market?.address && proposedMarket.address.equals(market.address),
    )
    ?.address?.toBase58();

  return (
    <Select
      showSearch
      size={'large'}
      style={{ width: 200 }}
      placeholder={placeholder || 'Select a market'}
      optionFilterProp="name"
      onSelect={onSetMarketAddress}
      listHeight={400}
      value={selectedMarket}
      filterOption={(input, option) =>
        option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {customMarkets && customMarkets.length > 0 && (
        <OptGroup label="Custom">
          {customMarkets.map(({ address, name }, i) => (
            <Option
              value={address}
              key={nanoid()}
              name={name}
              style={{
                padding: '10px',
                // @ts-ignore
                backgroundColor: i % 2 === 0 ? 'rgb(39, 44, 61)' : null,
              }}
            >
              <Row>
                <Col flex="auto">{name}</Col>
                {selectedMarket !== address && (
                  <Col>
                    <DeleteOutlined
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        onDeleteCustomMarket && onDeleteCustomMarket(address);
                      }}
                    />
                  </Col>
                )}
              </Row>
            </Option>
          ))}
        </OptGroup>
      )}
      <OptGroup label="Markets">
        {markets
          .sort((a, b) =>
            extractQuote(a.name) === 'USDT' && extractQuote(b.name) !== 'USDT'
              ? -1
              : extractQuote(a.name) !== 'USDT' &&
                extractQuote(b.name) === 'USDT'
              ? 1
              : 0,
          )
          .sort((a, b) =>
            extractBase(a.name) < extractBase(b.name)
              ? -1
              : extractBase(a.name) > extractBase(b.name)
              ? 1
              : 0,
          )
          .map(({ address, name, deprecated }, i) => (
            <Option
              value={address.toBase58()}
              key={nanoid()}
              name={name}
              style={{
                padding: '10px',
                // @ts-ignore
                backgroundColor: i % 2 === 0 ? 'rgb(39, 44, 61)' : null,
              }}
            >
              {name} {deprecated ? ' (Deprecated)' : null}
            </Option>
          ))}
      </OptGroup>
    </Select>
  );
}

const DeprecatedMarketsPage = ({ switchToLiveMarkets }) => {
  return (
    <>
      <Row>
        <Col flex="auto">
          <DeprecatedMarketsInstructions
            switchToLiveMarkets={switchToLiveMarkets}
          />
        </Col>
      </Row>
    </>
  );
};

const RenderNormal = ({ onChangeOrderRef, onPrice, onSize }) => {
  return (
    <Row
      style={{
        minHeight: '900px',
        flexWrap: 'nowrap',
      }}
    >
      <Col flex="auto" style={{ display: 'flex', flexDirection: 'column' }}>
        <FloatingElement style={{ flex: 1, minHeight: '600px', padding: 0, overflow: 'hidden' }}>
          <TVChartContainer />
        </FloatingElement>
        <UserInfoTable />
      </Col>
      <Col flex={'400px'} style={{ display: 'flex', flexDirection: 'column' }}>
        <Orderbook smallScreen={false} onPrice={onPrice} onSize={onSize} />
        <TradesTable smallScreen={false} />
      </Col>
      <Col flex="270px" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <TradeForm setChangeOrderRef={onChangeOrderRef} style={{ minHeight: 300 }} />
        <StandaloneBalancesDisplay />
      </Col>
    </Row>
  );
};

const RenderSmall = ({ onChangeOrderRef, onPrice, onSize }) => {
  return (
    <>
      <Row>
        <Col flex="2" style={{ display: 'flex', flexDirection: 'column' }}>
          <FloatingElement style={{ flex: 2, minHeight: '150px', padding: 0, overflow: 'hidden' }}>
            <TVChartContainer />
          </FloatingElement>
        </Col>
        <Col flex="1">
          <StandaloneBalancesDisplay />
        </Col>
      </Row>
      <Row>
        {/* style={{
          height: '950px',
        }} */}
        <Col flex="1" style={{ maxHeight: '450px', display: 'flex' }}>
          <Orderbook smallScreen={true} onPrice={onPrice} onSize={onSize} />
        </Col>
        <Col
          flex="1"
          style={{
            height: '450px',
            display: 'flex',
          }}
        >
          <TradeForm setChangeOrderRef={onChangeOrderRef} />
        </Col>
        <Col flex="1" style={{ maxHeight: '450px', display: 'flex' }}>
          <TradesTable smallScreen={true} />
        </Col>
      </Row>
      <Row>
        <Col flex="auto">
          <UserInfoTable />
        </Col>
      </Row>
    </>
  );
};

const RenderSmaller = ({ onChangeOrderRef, onPrice, onSize }) => {
  return (
    <>
      <Row>
        <Col flex="auto" style={{ display: 'flex', flexDirection: 'column' }}>
          <FloatingElement style={{ flex: "1", minHeight: '600px', padding: 0, overflow: 'hidden' }}>
            <TVChartContainer />
          </FloatingElement>
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={12} style={{ height: '50%', display: 'flex' }}>
          <TradeForm style={{ flex: 1 }} setChangeOrderRef={onChangeOrderRef} />
        </Col>
        <Col xs={24} sm={12}>
          <StandaloneBalancesDisplay />
        </Col>
      </Row>
      <Row>
        <Col xs={24} sm={12} style={{ height: '100%', display: 'flex' }}>
          <Orderbook smallScreen={false} onPrice={onPrice} onSize={onSize} />
        </Col>
        <Col xs={24} sm={12} style={{ height: '50%', display: 'flex', maxHeight: '500px' }}>
          <TradesTable smallScreen={true} />
        </Col>
      </Row>
      <Row>
        <Col flex="auto" style={{ height: '100%', display: 'flex' }}>
          <UserInfoTable />
        </Col>
      </Row>
    </>
  );
};