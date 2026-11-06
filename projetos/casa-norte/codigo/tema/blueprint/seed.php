<?php
// Demo content for the Casa Norte theme: types, neighborhoods, listings. Fictional agency.
require_once '/wordpress/wp-load.php';

foreach ( array( 'Apartamento', 'Casa', 'Cobertura', 'Studio' ) as $t ) {
	wp_insert_term( $t, 'tipo' );
}
foreach ( array( 'Batel', 'Água Verde', 'Bacacheri', 'Santa Felicidade' ) as $b ) {
	wp_insert_term( $b, 'bairro' );
}

// title, type, neighborhood, purpose, price, beds, baths, parking, area, featured, description
$items = array(
	array( 'Apartamento claro com varanda gourmet', 'Apartamento', 'Batel', 'venda', 1280000, 3, 2, 2, 118, 1, 'Terceiro andar, sol da manhã, varanda com churrasqueira e cozinha integrada. Prédio com salão de festas e academia, a duas quadras da Av. do Batel.' ),
	array( 'Casa térrea com quintal e edícula', 'Casa', 'Santa Felicidade', 'venda', 890000, 3, 2, 3, 210, 1, 'Terreno de 450 m², edícula com banheiro, pomar e garagem para três carros. Rua tranquila, perto de escolas e comércio.' ),
	array( 'Studio mobiliado perto do parque', 'Studio', 'Água Verde', 'aluguel', 3200, 1, 1, 1, 34, 1, 'Mobiliado, com ar-condicionado, lavanderia coletiva e portaria 24h. Condomínio incluso no valor.' ),
	array( 'Cobertura duplex com terraço', 'Cobertura', 'Batel', 'venda', 2450000, 4, 4, 3, 260, 0, 'Dois pavimentos, terraço com jacuzzi, lareira e vista aberta para a cidade. Acabamento de alto padrão.' ),
	array( 'Apartamento de 2 quartos reformado', 'Apartamento', 'Água Verde', 'venda', 540000, 2, 1, 1, 66, 0, 'Reformado em 2024, piso novo, armários planejados e condomínio com baixo custo. Pronto para morar.' ),
	array( 'Casa em condomínio fechado', 'Casa', 'Bacacheri', 'aluguel', 8900, 4, 3, 4, 240, 0, 'Condomínio com segurança e área verde, quatro suítes, escritório e espaço gourmet. Aceita pets.' ),
	array( 'Apartamento 3 quartos, andar alto', 'Apartamento', 'Bacacheri', 'aluguel', 4800, 3, 2, 2, 98, 0, 'Andar alto, vista livre, cozinha com armários e duas vagas cobertas. Condomínio com piscina.' ),
	array( 'Casa geminada de esquina', 'Casa', 'Água Verde', 'venda', 720000, 3, 2, 2, 140, 0, 'Esquina com muita luz natural, terraço, churrasqueira e fácil acesso ao transporte público.' ),
	array( 'Studio novo próximo ao centro', 'Studio', 'Batel', 'venda', 410000, 1, 1, 1, 38, 0, 'Entregue em 2025, varanda integrada e coworking no térreo. Ótimo para investir.' ),
);

wp_delete_post( 1, true );
wp_delete_post( 2, true );
foreach ( $items as $i => $it ) {
	$pid = wp_insert_post( array(
		'post_type'    => 'imovel',
		'post_status'  => 'publish',
		'post_title'   => $it[0],
		'post_excerpt' => $it[10],
		'post_content' => '<p>' . $it[10] . '</p>',
		'menu_order'   => $i,
		'meta_input'   => array(
			'cn_finalidade' => $it[3],
			'cn_preco'      => $it[4],
			'cn_quartos'    => $it[5],
			'cn_banheiros'  => $it[6],
			'cn_vagas'      => $it[7],
			'cn_area'       => $it[8],
			'cn_destaque'   => $it[9] ? '1' : '',
		),
	) );
	wp_set_object_terms( $pid, array( $it[1] ), 'tipo' );
	wp_set_object_terms( $pid, array( $it[2] ), 'bairro' );
}

$menu_id = wp_create_nav_menu( 'Principal' );
foreach ( array( 'Imóveis' => '/imoveis/', 'Bairros' => '/#bairros', 'Como atuamos' => '/#servicos', 'Contato' => '/#contato' ) as $label => $path ) {
	wp_update_nav_menu_item( $menu_id, 0, array( 'menu-item-title' => $label, 'menu-item-url' => home_url( $path ), 'menu-item-status' => 'publish', 'menu-item-type' => 'custom' ) );
}
set_theme_mod( 'nav_menu_locations', array( 'primary' => $menu_id, 'footer' => $menu_id ) );
update_option( 'blogname', 'Casa Norte Imóveis' );
update_option( 'blogdescription', 'Compra, venda e locação de imóveis em Curitiba' );
update_option( 'permalink_structure', '/%postname%/' );
flush_rewrite_rules();
update_option( 'sidebars_widgets', array( 'footer-notice' => array() ) );
